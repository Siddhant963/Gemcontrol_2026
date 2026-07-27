import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/firm.dart';
import '../repositories/firm_repository.dart';

/// GemControl is single-firm-per-shop in practice (one owner, one firm
/// record) — the whole app works against "the firm", so this resolves to
/// the first firm the logged-in owner/staff can see.
final firmsProvider = FutureProvider<List<Firm>>((ref) async {
  return ref.watch(firmRepositoryProvider).getAllFirms();
});

final currentFirmProvider = Provider<Firm?>((ref) {
  final firms = ref.watch(firmsProvider).valueOrNull;
  if (firms == null || firms.isEmpty) return null;
  return firms.first;
});
