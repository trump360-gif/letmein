import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import 'auth_models.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRepository(apiClient.dio);
});

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;
  final _storage = TokenStorage();

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) => _storage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);

  Future<void> saveAccessToken(String accessToken) => _storage.saveAccessToken(accessToken);
  Future<String?> readAccessToken() => _storage.readAccessToken();
  Future<String?> readRefreshToken() => _storage.readRefreshToken();
  Future<void> clearTokens() => _storage.clearTokens();

  // ──────────────────────────────────────────────
  // API calls
  // ──────────────────────────────────────────────

  /// POST /api/v1/auth/kakao
  Future<AuthResponse> kakaoLogin(String kakaoAccessToken) async {
    final response = await _dio.post('/auth/kakao', data: {
      'kakaoAccessToken': kakaoAccessToken,
    });
    final data = response.data['data'] as Map<String, dynamic>;
    return AuthResponse.fromJson(data);
  }

  /// POST /api/v1/auth/dev-login — DEV ONLY
  Future<AuthResponse> devLogin({int userId = 1}) async {
    final response = await _dio.post('/auth/dev-login', data: {
      'userId': userId,
    });
    final data = response.data['data'] as Map<String, dynamic>;
    return AuthResponse.fromJson(data);
  }

  /// POST /api/v1/auth/refresh
  Future<RefreshResponse> refreshToken(String refreshToken) async {
    final response = await _dio.post('/auth/refresh', data: {
      'refreshToken': refreshToken,
    });
    final data = response.data['data'] as Map<String, dynamic>;
    return RefreshResponse.fromJson(data);
  }

  /// POST /api/v1/auth/logout
  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }

  /// GET /api/v1/auth/nickname/check?nickname=xxx
  Future<bool> checkNickname(String nickname) async {
    final response = await _dio.get(
      '/auth/nickname/check',
      queryParameters: {'nickname': nickname},
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return NicknameCheckResponse.fromJson(data).available;
  }

  /// POST /api/v1/auth/nickname
  Future<UserModel> updateNickname(String nickname) async {
    final response = await _dio.post('/auth/nickname', data: {
      'nickname': nickname,
    });
    final data = response.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// DELETE /api/v1/auth/account
  Future<void> deleteAccount() async {
    await _dio.delete('/auth/account');
  }

  /// POST /api/v1/auth/interests — 관심 시술 저장
  /// 서버 미구현 시에도 로컬에서 조용히 무시함.
  Future<void> saveInterests(List<int> categoryIds) async {
    if (categoryIds.isEmpty) return;
    try {
      await _dio.post('/auth/interests', data: {'categoryIds': categoryIds});
    } catch (_) {
      // 관심 시술은 부가 기능이므로 에러 전파 생략
    }
  }

  /// POST /api/v1/auth/withdraw — 탈퇴 신청 (7일 유예)
  Future<void> withdrawAccount() async {
    await _dio.post('/auth/withdraw');
  }

  /// POST /api/v1/auth/restore — 탈퇴 철회
  Future<void> restoreAccount() async {
    await _dio.post('/auth/restore');
  }

  /// GET /api/v1/auth/me — 현재 유저 정보 조회
  Future<UserModel> getMe() async {
    final response = await _dio.get('/auth/me');
    final data = response.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] as Map<String, dynamic>? ?? data);
  }
}
