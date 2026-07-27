import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/customer.dart';

class CustomerRepository {
  final ApiClient _client;
  CustomerRepository(this._client);

  Future<List<Customer>> getAllCustomers() {
    return _client.request(
      (dio) => dio.get('/getAllCustomers'),
      (data) => (data as List).map((e) => Customer.fromJson(e)).toList(),
    );
  }

  Future<Customer> addCustomer({
    required String name,
    required String email,
    required String contact,
    required String address,
    required String firmId,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/AddCustomer',
        data: {
          'name': name,
          'email': email,
          'contact': contact,
          'address': address,
          'firm': firmId,
        },
      ),
      (data) => Customer.fromJson(data['customer']),
    );
  }

  Future<void> removeCustomer(String customerId) {
    return _client.request(
      (dio) =>
          dio.get('/removeCustomer', queryParameters: {'customerId': customerId}),
      (_) => null,
    );
  }
}

final customerRepositoryProvider = Provider<CustomerRepository>((ref) {
  return CustomerRepository(ref.watch(apiClientProvider));
});
