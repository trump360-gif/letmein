import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/auth_repository.dart';
import '../data/auth_models.dart';
export '../data/auth_models.dart' show UserExtra;

// ──────────────────────────────────────────────
// Auth State
// ──────────────────────────────────────────────

enum AuthStatus {
  /// Initial, not yet determined
  unknown,

  /// Token exists and is valid
  authenticated,

  /// No token or token expired
  unauthenticated,

  /// Logged in but no nickname set (isNewUser == true)
  newUser,
}

class AuthState {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.userExtra = UserExtra.empty,
    this.errorMessage,
    this.isLoading = false,
  });

  final AuthStatus status;
  final UserModel? user;

  /// freezed 재생성 없이 status, isCastMember 등 추가 필드 보관
  final UserExtra userExtra;

  final String? errorMessage;
  final bool isLoading;

  /// 탈퇴 신청 후 7일 유예 상태
  bool get isWithdrawing => userExtra.isWithdrawing;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isNewUser => status == AuthStatus.newUser;

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    UserExtra? userExtra,
    String? errorMessage,
    bool? isLoading,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      userExtra: userExtra ?? this.userExtra,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// ──────────────────────────────────────────────
// AuthNotifier
// ──────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository) : super(const AuthState()) {
    _initializeAuth();
  }

  final AuthRepository _repository;

  /// Called on app start: check if a valid access token already exists.
  /// Attempts a token refresh if needed.
  Future<void> _initializeAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final accessToken = await _repository.readAccessToken();
      if (accessToken == null) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          isLoading: false,
        );
        return;
      }

      // Try to refresh to verify the refresh token is still valid.
      final storedRefreshToken = await _repository.readRefreshToken();
      if (storedRefreshToken == null) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          isLoading: false,
          clearUser: true,
        );
        return;
      }

      final refreshResponse =
          await _repository.refreshToken(storedRefreshToken);
      await _repository.saveAccessToken(refreshResponse.accessToken);

      state = state.copyWith(
        status: AuthStatus.authenticated,
        isLoading: false,
      );
    } catch (_) {
      await _repository.clearTokens();
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isLoading: false,
        clearUser: true,
      );
    }
  }

  /// Kakao login flow.
  ///
  /// For MVP: pass a mock token; replace with real Kakao SDK token later.
  /// TODO: Integrate flutter_kakao_sdk and obtain real kakaoAccessToken.
  Future<void> loginWithKakao(String kakaoAccessToken) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      // DEV: use dev-login instead of Kakao OAuth
      final authResponse = await _repository.devLogin();

      await _repository.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );

      // userExtra (status, isCastMember) 파싱 — raw data에서 직접 추출
      UserExtra extra = UserExtra.empty;
      try {
        final raw = authResponse.toJson();
        final rawUser = raw['user'] as Map<String, dynamic>?;
        if (rawUser != null) extra = UserExtra.fromJson(rawUser);
      } catch (_) {}

      if (authResponse.isNewUser) {
        state = state.copyWith(
          status: AuthStatus.newUser,
          user: authResponse.user,
          userExtra: extra,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: authResponse.user,
          userExtra: extra,
          isLoading: false,
        );
      }
    } catch (e, st) {
      // ignore: avoid_print
      print('LOGIN ERROR: $e');
      // ignore: avoid_print
      print('STACK: $st');
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isLoading: false,
        errorMessage: _parseError(e),
      );
    }
  }

  /// Updates the nickname and transitions to authenticated.
  Future<void> updateNickname(String nickname) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.updateNickname(nickname);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _parseError(e),
      );
    }
  }

  /// Logs out the current user.
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _repository.logout();
    } catch (_) {
      // Even if the server call fails, clear local tokens.
    } finally {
      await _repository.clearTokens();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Initiates account deletion (legacy — kept for compatibility).
  Future<void> deleteAccount() async {
    await withdrawAccount();
  }

  /// 탈퇴 신청 (7일 유예 시작). 서버는 status='withdrawing'으로 변경.
  Future<void> withdrawAccount() async {
    state = state.copyWith(isLoading: true);
    try {
      await _repository.withdrawAccount();
    } catch (_) {
      // Continue even on network failure.
    } finally {
      await _repository.clearTokens();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// 탈퇴 철회 — status='withdrawing' → 'active'
  Future<void> restoreAccount() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.restoreAccount();
      state = state.copyWith(
        isLoading: false,
        userExtra: UserExtra(
          status: 'active',
          isCastMember: state.userExtra.isCastMember,
        ),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _parseError(e),
      );
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  String _parseError(Object e) {
    // TODO: map backend error codes to Korean messages.
    return '오류가 발생했습니다. 다시 시도해주세요.';
  }
}

// ──────────────────────────────────────────────
// Providers
// ──────────────────────────────────────────────

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});
