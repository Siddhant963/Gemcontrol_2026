import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/token_storage.dart';
import '../config/api_config.dart';

/// Prefixes a relative upload path returned by the API with the server's
/// uploads root. Already-absolute URLs pass through. The backend actually
/// returns paths already including the "Uploads/" segment (e.g.
/// "/Uploads/stock/17012-abc.jpg"), so that's stripped first to avoid
/// doubling it up into ".../Uploads/Uploads/stock/..." (a 404).
String resolveUploadUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  var cleaned = path.startsWith('/') ? path.substring(1) : path;
  if (cleaned.startsWith('Uploads/')) {
    cleaned = cleaned.substring('Uploads/'.length);
  }
  return '${ApiConfig.uploadsBaseUrl}/Uploads/$cleaned';
}

class UnauthorizedException implements Exception {}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

class ApiClient {
  final Dio dio;
  final TokenStorage tokenStorage;
  void Function()? onUnauthorized;

  ApiClient(this.tokenStorage)
    : dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 30),
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenStorage.readToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            // TEMP DIAGNOSTIC — remove once the spurious-logout cause is found.
            // ignore: avoid_print
            print(
              '[401] ${error.requestOptions.method} ${error.requestOptions.path} '
              'auth-header-sent=${error.requestOptions.headers['Authorization'] != null} '
              'body=${error.response?.data}',
            );
            tokenStorage.clear();
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] is String) return data['message'];
    return e.message ?? 'Something went wrong';
  }

  Future<T> request<T>(
    Future<Response> Function(Dio dio) call,
    T Function(dynamic data) parse,
  ) async {
    try {
      final response = await call(dio);
      return parse(response.data);
    } on DioException catch (e) {
      throw ApiException(
        _extractMessage(e),
        statusCode: e.response?.statusCode,
      );
    }
  }
}

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return ApiClient(storage);
});
