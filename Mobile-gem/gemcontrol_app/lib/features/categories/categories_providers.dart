import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/stock_category.dart';
import '../../core/repositories/stock_category_repository.dart';

final categoriesProvider =
    FutureProvider.autoDispose<List<StockCategory>>((ref) {
  return ref.watch(stockCategoryRepositoryProvider).getAllCategories();
});
