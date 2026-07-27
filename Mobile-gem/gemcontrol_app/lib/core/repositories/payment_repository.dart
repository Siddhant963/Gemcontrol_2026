import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/payment.dart';
import '../models/udhar.dart';

class PaymentRepository {
  final ApiClient _client;
  PaymentRepository(this._client);

  Future<List<Payment>> getAllPayments() {
    return _client.request(
      (dio) => dio.get('/getAllPayments'),
      (data) => (data as List).map((e) => Payment.fromJson(e)).toList(),
    );
  }
}

class UdharRepository {
  final ApiClient _client;
  UdharRepository(this._client);

  Future<List<Udhar>> getAllUdhar() {
    return _client.request(
      (dio) => dio.get('/getAllUdhar'),
      (data) => (data as List).map((e) => Udhar.fromJson(e)).toList(),
    );
  }

  Future<void> settleUdhar(String udharId, double amount) {
    return _client.request(
      (dio) => dio.post(
        '/setelUdhar',
        data: {'udharId': udharId, 'amount': amount},
      ),
      (_) => null,
    );
  }

  Future<List<UdharSettlement>> getAllSettlements() {
    return _client.request(
      (dio) => dio.get('/getAllUdharSetelment'),
      (data) => (data as List).map((e) => UdharSettlement.fromJson(e)).toList(),
    );
  }
}

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.watch(apiClientProvider));
});

final udharRepositoryProvider = Provider<UdharRepository>((ref) {
  return UdharRepository(ref.watch(apiClientProvider));
});
