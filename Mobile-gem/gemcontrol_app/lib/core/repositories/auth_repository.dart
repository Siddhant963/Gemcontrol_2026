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

  /// Public self-signup: creates a brand-new Firm (shop) and its admin
  /// account together in one step, via the same `/register` endpoint the
  /// web app's "Set Up Your Shop" page uses. No auth required to call this
  /// -- unlike [register] above, which needs an already-logged-in admin.
  /// The backend doesn't return a session token for this path, so the
  /// caller logs in separately afterwards.
  Future<AppUser> registerShop({
    required String name,
    required String email,
    required String contact,
    required String password,
    required String firmName,
    required String firmLocation,
    required String firmSize,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/register',
        data: {
          'name': name,
          'email': email,
          'contact': contact,
          'password': password,
          'firmName': firmName,
          'firmLocation': firmLocation,
          'firmSize': firmSize,
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

  /// Self-service account deletion (App Store guideline 5.1.1(v) requires
  /// any app offering account creation to also offer in-app deletion).
  /// [password] re-confirms it's really the account owner. See
  /// Backend/Controllers/adminController.js's deleteMyAccount for the
  /// actual policy: revokes login immediately; for an admin, deactivates
  /// every staff account under the same firm too. Business records
  /// (customers, sales, invoices, stock) are always kept, never erased.
  Future<void> deleteMyAccount(String password) {
    return _client.request(
      (dio) => dio.post('/deleteAccount', data: {'password': password}),
      (_) => null,
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});
