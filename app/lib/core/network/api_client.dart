import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/token_storage.dart';

const _kBaseUrl = 'http://localhost:8080/api/v1';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _kBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(AuthInterceptor(_dio));
  }

  Dio get dio => _dio;
}

class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor(this._dio);

  final Dio _dio;
  final _storage = TokenStorage();

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.readAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;

    if (response?.statusCode == 401 &&
        !(err.requestOptions.path.contains('/auth/refresh'))) {
      try {
        final refreshToken = await _storage.readRefreshToken();
        if (refreshToken == null) {
          await _storage.clearTokens();
          handler.next(err);
          return;
        }

        final refreshDio = Dio(BaseOptions(
          baseUrl: _kBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        ));

        final refreshResponse = await refreshDio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
        );

        final newAccessToken =
            refreshResponse.data['data']['accessToken'] as String;

        await _storage.saveAccessToken(newAccessToken);

        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        final retryResponse = await _dio.fetch<dynamic>(retryOptions);
        handler.resolve(retryResponse);
        return;
      } on DioException catch (refreshErr) {
        await _storage.clearTokens();
        handler.next(refreshErr);
        return;
      } catch (_) {
        await _storage.clearTokens();
        handler.next(err);
        return;
      }
    }

    handler.next(err);
  }
}
