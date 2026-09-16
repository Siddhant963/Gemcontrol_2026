import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../api/api_client.dart';
import '../models/firm.dart';

class FirmRepository {
  final ApiClient _client;
  FirmRepository(this._client);

  // XFile.readAsBytes() + MultipartFile.fromBytes works on both web and
  // native -- unlike MultipartFile.fromFileSync/File(path), which need
  // dart:io and throw (uncaught, silently killing the save) on Flutter Web.
  Future<MultipartFile> _toMultipart(XFile file) async {
    final bytes = await file.readAsBytes();
    return MultipartFile.fromBytes(bytes, filename: file.name);
  }

  Future<List<Firm>> getAllFirms() {
    return _client.request(
      (dio) => dio.get('/getAllFirms'),
      (data) => (data as List).map((e) => Firm.fromJson(e)).toList(),
    );
  }

  Future<Firm> createFirm(
    Map<String, dynamic> fields, {
    Map<String, XFile?> images = const {},
  }) async {
    final imageParts = <String, MultipartFile>{};
    for (final entry in images.entries) {
      if (entry.value != null) imageParts[entry.key] = await _toMultipart(entry.value!);
    }
    return _client.request(
      (dio) => dio.post(
        '/createFirm',
        data: FormData.fromMap({...fields, ...imageParts}),
      ),
      (data) => Firm.fromJson(data['firm']),
    );
  }

  Future<Firm> updateFirm(
    String firmId,
    Map<String, dynamic> fields, {
    Map<String, XFile?> images = const {},
  }) async {
    final imageParts = <String, MultipartFile>{};
    for (final entry in images.entries) {
      if (entry.value != null) imageParts[entry.key] = await _toMultipart(entry.value!);
    }
    return _client.request(
      (dio) => dio.put(
        '/updateFirm',
        data: FormData.fromMap({'firmId': firmId, ...fields, ...imageParts}),
      ),
      (data) => Firm.fromJson(data['firm']),
    );
  }

  Future<void> removeFirm(String firmId) {
    return _client.request(
      (dio) => dio.get('/removeFirm', queryParameters: {'firmId': firmId}),
      (_) => null,
    );
  }
}

final firmRepositoryProvider = Provider<FirmRepository>((ref) {
  return FirmRepository(ref.watch(apiClientProvider));
});
