import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/stock_category.dart';

class StockCategoryRepository {
  final ApiClient _client;
  StockCategoryRepository(this._client);

  Future<List<StockCategory>> getAllCategories() {
    return _client.request(
      (dio) => dio.get('/getAllStockCategories'),
      (data) => (data as List).map((e) => StockCategory.fromJson(e)).toList(),
    );
  }

  Future<StockCategory> createCategory({
    required String name,
    required String description,
    String? imagePath,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/createStockCategory',
        data: FormData.fromMap({
          'name': name,
          'description': description,
          if (imagePath != null)
            'CategoryImg': MultipartFile.fromFileSync(imagePath),
        }),
      ),
      (data) => StockCategory.fromJson(data['category']),
    );
  }

  Future<void> removeCategory(String categoryId) {
    return _client.request(
      (dio) => dio.get(
        '/removeStockCategory',
        queryParameters: {'categoryId': categoryId},
      ),
      (_) => null,
    );
  }
}

final stockCategoryRepositoryProvider = Provider<StockCategoryRepository>((ref) {
  return StockCategoryRepository(ref.watch(apiClientProvider));
});
