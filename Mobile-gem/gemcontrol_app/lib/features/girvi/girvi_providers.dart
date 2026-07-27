import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/girvi.dart';
import '../../core/repositories/girvi_repository.dart';

final girviItemsProvider = FutureProvider.autoDispose<List<Girvi>>((ref) {
  return ref.watch(girviRepositoryProvider).getAllGirviItems();
});

final girviSummaryProvider = FutureProvider.autoDispose<List<GirviSummaryRow>>((ref) {
  return ref.watch(girviRepositoryProvider).getSummary();
});
