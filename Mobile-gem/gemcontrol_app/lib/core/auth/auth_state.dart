import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../repositories/auth_repository.dart';

class AuthSession {
  final bool isLoggedIn;
  final String? role;

  const AuthSession({required this.isLoggedIn, this.role});

  bool get isAdmin => (role ?? '').toLowerCase() == 'admin';

  static const loggedOut = AuthSession(isLoggedIn: false);
}

class AuthController extends AsyncNotifier<AuthSession> {
  @override
  Future<AuthSession> build() async {
    final storage = ref.watch(tokenStorageProvider);
    final token = await storage.readToken();
    final role = await storage.readRole();
    ref.read(apiClientProvider).onUnauthorized = () {
      state = const AsyncData(AuthSession.loggedOut);
    };
    if (token == null) return AuthSession.loggedOut;
    return AuthSession(isLoggedIn: true, role: role);
  }

  Future<String?> login(String email, String password) async {
    final repo = ref.read(authRepositoryProvider);
    final storage = ref.read(tokenStorageProvider);
    try {
      final result = await repo.login(email, password);
      await storage.save(token: result.token, role: result.role);
      state = AsyncData(AuthSession(isLoggedIn: true, role: result.role));
      return null;
    } on ApiException catch (e) {
      return e.message;
    }
  }

  Future<void> logout() async {
    final storage = ref.read(tokenStorageProvider);
    try {
      await ref.read(authRepositoryProvider).logout();
    } catch (_) {
      // Best-effort — clear local session regardless of network state.
    }
    await storage.clear();
    state = const AsyncData(AuthSession.loggedOut);
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSession>(AuthController.new);
