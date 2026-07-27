import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/sale.dart';
import '../../core/repositories/sale_repository.dart';

final allSalesProvider = FutureProvider.autoDispose<List<Sale>>((ref) {
  return ref.watch(saleRepositoryProvider).getAllSales();
});
