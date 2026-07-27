import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/raw_material.dart';

class RawMaterialRepository {
  final ApiClient _client;
  RawMaterialRepository(this._client);

  Future<List<RawMaterial>> getAllRawMaterials() {
    return _client.request(
      (dio) => dio.get('/getAllRawMaterials'),
      (data) => (data as List).map((e) => RawMaterial.fromJson(e)).toList(),
    );
  }

  Future<RawMaterial> createRawMaterial({
    required String name,
    required String materialType,
    required double quantity,
    required String firmId,
    String? imagePath,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/createRawMaterial',
        data: FormData.fromMap({
          'name': name,
          'materialType': materialType,
          'quantity': quantity,
          'firm': firmId,
          if (imagePath != null)
            'rawMaterial': MultipartFile.fromFileSync(imagePath),
        }),
      ),
      (data) => RawMaterial.fromJson(data['rawMaterial']),
    );
  }

  Future<RawMaterial> addStock(String rawMaterialId, double quantity) {
    return _client.request(
      (dio) => dio.post(
        '/AddRawMaterialStock',
        data: {'rawMaterialId': rawMaterialId, 'quantity': quantity},
      ),
      (data) => RawMaterial.fromJson(data['rawMaterial']),
    );
  }

  Future<void> removeRawMaterial(String rawMaterialId) {
    return _client.request(
      (dio) => dio.get(
        '/removeRawMaterial',
        queryParameters: {'rawMaterialId': rawMaterialId},
      ),
      (_) => null,
    );
  }
}

final rawMaterialRepositoryProvider = Provider<RawMaterialRepository>((ref) {
  return RawMaterialRepository(ref.watch(apiClientProvider));
});
