import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/stock.dart';
import '../../core/repositories/stock_repository.dart';

final stockListProvider = FutureProvider.autoDispose<List<Stock>>((ref) {
  return ref.watch(stockRepositoryProvider).getAllStocks();
});

const materialTypes = ['All', 'gold', 'silver', 'platinum', 'diamond', 'other'];

String materialTypeLabel(String t) =>
    t == 'All' ? 'All' : '${t[0].toUpperCase()}${t.substring(1)}';
