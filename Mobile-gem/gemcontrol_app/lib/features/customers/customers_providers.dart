import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/customer.dart';
import '../../core/repositories/customer_repository.dart';

final customersProvider = FutureProvider.autoDispose<List<Customer>>((ref) {
  return ref.watch(customerRepositoryProvider).getAllCustomers();
});
