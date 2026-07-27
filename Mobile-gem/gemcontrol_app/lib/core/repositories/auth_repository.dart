import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/user.dart';

class LoginResult {
  final String token;
  final String role;
  LoginResult({required this.token, required this.role});
}

class AuthRepository {
  final ApiClient _client;
  AuthRepository(this._client);

  Future<LoginResult> login(String email, String password) {
    return _client.request(
      (dio) => dio.post('/login', data: {'email': email, 'password': password}),
      (data) => LoginResult(token: data['token'] ?? '', role: data['role'] ?? 'staff'),
    );
  }

  Future<void> logout() {
    return _client.request((dio) => dio.get('/logout'), (_) => null);
  }

  Future<List<AppUser>> getAllUsers() {
    return _client.request(
      (dio) => dio.get('/GetallUsers'),
      (data) => (data as List).map((e) => AppUser.fromJson(e)).toList(),
    );
  }

  Future<AppUser> register({
    required String name,
    required String email,
    required String contact,
    required String password,
    required String role,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/admin/register',
        data: {
          'name': name,
          'email': email,
          'contact': contact,
          'password': password,
          'role': role,
        },
      ),
      (data) => AppUser.fromJson(data['user']),
    );
  }

  Future<void> updateUser({
    required String userId,
    required String name,
    required String contact,
    required String role,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/UpdateUser',
        queryParameters: {'userId': userId},
        data: {'name': name, 'contact': contact, 'role': role},
      ),
      (_) => null,
    );
  }

  Future<void> removeUser(String userId) {
    return _client.request((dio) => dio.get('/remove/$userId'), (_) => null);
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});
