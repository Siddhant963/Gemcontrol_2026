import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _tokenKey = 'gc_token';
  static const _roleKey = 'gc_role';
  static const _userIdKey = 'gc_user_id';
  static const _nameKey = 'gc_name';

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> save({
    required String token,
    required String role,
    String? userId,
    String? name,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _roleKey, value: role);
    if (userId != null) await _storage.write(key: _userIdKey, value: userId);
    if (name != null) await _storage.write(key: _nameKey, value: name);
  }

  Future<String?> readToken() => _storage.read(key: _tokenKey);
  Future<String?> readRole() => _storage.read(key: _roleKey);
  Future<String?> readUserId() => _storage.read(key: _userIdKey);
  Future<String?> readName() => _storage.read(key: _nameKey);

  Future<void> clear() => _storage.deleteAll();
}
