import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/firm.dart';

class FirmRepository {
  final ApiClient _client;
  FirmRepository(this._client);

  Future<List<Firm>> getAllFirms() {
    return _client.request(
      (dio) => dio.get('/getAllFirms'),
      (data) => (data as List).map((e) => Firm.fromJson(e)).toList(),
    );
  }

  Future<Firm> createFirm(Map<String, dynamic> fields, {String? logoPath}) {
    return _client.request(
      (dio) => dio.post(
        '/createFirm',
        data: FormData.fromMap({
          ...fields,
          if (logoPath != null) 'logo': MultipartFile.fromFileSync(logoPath),
        }),
      ),
      (data) => Firm.fromJson(data['firm']),
    );
  }

  Future<Firm> updateFirm(
    String firmId,
    Map<String, dynamic> fields, {
    String? logoPath,
  }) {
    return _client.request(
      (dio) => dio.put(
        '/updateFirm',
        data: FormData.fromMap({
          'firmId': firmId,
          ...fields,
          if (logoPath != null) 'logo': MultipartFile.fromFileSync(logoPath),
        }),
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
