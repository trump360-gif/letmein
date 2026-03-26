import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccessTokenKey = 'access_token';
const _kRefreshTokenKey = 'refresh_token';

/// Token storage that works on both mobile (secure storage) and web (in-memory for dev).
class TokenStorage {
  // On mobile: use flutter_secure_storage
  // On web: use simple in-memory map (secure storage WebCrypto fails on non-HTTPS localhost)
  static final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  static final Map<String, String> _webStorage = {};

  Future<void> write(String key, String value) async {
    if (kIsWeb) {
      _webStorage[key] = value;
    } else {
      await _secureStorage.write(key: key, value: value);
    }
  }

  Future<String?> read(String key) async {
    if (kIsWeb) {
      return _webStorage[key];
    }
    return _secureStorage.read(key: key);
  }

  Future<void> delete(String key) async {
    if (kIsWeb) {
      _webStorage.remove(key);
    } else {
      await _secureStorage.delete(key: key);
    }
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await write(_kAccessTokenKey, accessToken);
    await write(_kRefreshTokenKey, refreshToken);
  }

  Future<void> saveAccessToken(String accessToken) async {
    await write(_kAccessTokenKey, accessToken);
  }

  Future<String?> readAccessToken() async {
    return read(_kAccessTokenKey);
  }

  Future<String?> readRefreshToken() async {
    return read(_kRefreshTokenKey);
  }

  Future<void> clearTokens() async {
    await delete(_kAccessTokenKey);
    await delete(_kRefreshTokenKey);
  }
}
