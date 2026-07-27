import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/raw_material.dart';
import '../../core/repositories/raw_material_repository.dart';

final rawMaterialsProvider = FutureProvider.autoDispose<List<RawMaterial>>((ref) {
  return ref.watch(rawMaterialRepositoryProvider).getAllRawMaterials();
});
