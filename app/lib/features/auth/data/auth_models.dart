import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_models.freezed.dart';
part 'auth_models.g.dart';

@freezed
abstract class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String nickname,
    String? profileImageUrl,
    @Default(false) bool isNewUser,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}

// ── 런타임 확장: status / isCastMember ──────────
// freezed 재생성 없이 JSON 필드를 직접 파싱하기 위한
// 보조 함수. auth_repository.dart에서 사용.

class UserExtra {
  const UserExtra({
    required this.status,
    required this.isCastMember,
  });

  final String status;
  final bool isCastMember;

  bool get isWithdrawing => status == 'withdrawing';

  factory UserExtra.fromJson(Map<String, dynamic> json) {
    return UserExtra(
      status: json['status'] as String? ?? 'active',
      isCastMember: json['isCastMember'] as bool? ??
          json['is_cast_member'] as bool? ??
          false,
    );
  }

  static const empty = UserExtra(status: 'active', isCastMember: false);
}

@freezed
abstract class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required String accessToken,
    required String refreshToken,
    required bool isNewUser,
    required UserModel user,
  }) = _AuthResponse;

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
}

@freezed
abstract class RefreshResponse with _$RefreshResponse {
  const factory RefreshResponse({
    required String accessToken,
  }) = _RefreshResponse;

  factory RefreshResponse.fromJson(Map<String, dynamic> json) =>
      _$RefreshResponseFromJson(json);
}

@freezed
abstract class NicknameCheckResponse with _$NicknameCheckResponse {
  const factory NicknameCheckResponse({
    required bool available,
  }) = _NicknameCheckResponse;

  factory NicknameCheckResponse.fromJson(Map<String, dynamic> json) =>
      _$NicknameCheckResponseFromJson(json);
}
