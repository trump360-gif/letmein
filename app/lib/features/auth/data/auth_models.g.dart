// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_UserModel _$UserModelFromJson(Map<String, dynamic> json) => _UserModel(
  id: json['id'].toString(),
  nickname: (json['nickname'] as String?) ?? '',
  profileImageUrl: json['profile_image'] as String?,
  isNewUser: json['isNewUser'] as bool? ?? false,
);

Map<String, dynamic> _$UserModelToJson(_UserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nickname': instance.nickname,
      'profile_image': instance.profileImageUrl,
      'isNewUser': instance.isNewUser,
    };

_AuthResponse _$AuthResponseFromJson(Map<String, dynamic> json) =>
    _AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      isNewUser: json['isNewUser'] as bool,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$AuthResponseToJson(_AuthResponse instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
      'isNewUser': instance.isNewUser,
      'user': instance.user,
    };

_RefreshResponse _$RefreshResponseFromJson(Map<String, dynamic> json) =>
    _RefreshResponse(accessToken: json['accessToken'] as String);

Map<String, dynamic> _$RefreshResponseToJson(_RefreshResponse instance) =>
    <String, dynamic>{'accessToken': instance.accessToken};

_NicknameCheckResponse _$NicknameCheckResponseFromJson(
  Map<String, dynamic> json,
) => _NicknameCheckResponse(available: json['available'] as bool);

Map<String, dynamic> _$NicknameCheckResponseToJson(
  _NicknameCheckResponse instance,
) => <String, dynamic>{'available': instance.available};
