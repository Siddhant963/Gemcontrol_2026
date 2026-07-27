import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/sale.dart';

class NewSaleRequest {
  final List<SaleItem> items;
  final String customerId;
  final String firmId;
  final double subtotal;
  final SaleDiscount discount;
  final double taxableAmount;
  final SaleGst gst;
  final double totalAmount;
  final String paymentMethod;
  final List<SalePayment> payments;
  final double udharAmount;

  NewSaleRequest({
    required this.items,
    required this.customerId,
    required this.firmId,
    required this.subtotal,
    required this.discount,
    required this.taxableAmount,
    required this.gst,
    required this.totalAmount,
    required this.paymentMethod,
    required this.payments,
    required this.udharAmount,
  });

  Map<String, dynamic> toJson() => {
    'items': items.map((e) => e.toRequestJson()).toList(),
    'customer': customerId,
    'firm': firmId,
    'subtotal': subtotal,
    'discount': discount.toJson(),
    'taxableAmount': taxableAmount,
    'gst': gst.toJson(),
    'totalAmount': totalAmount,
    'paymentMethod': paymentMethod,
    'payments': payments.map((e) => e.toJson()).toList(),
    'udharAmount': udharAmount,
  };
}

class SaleRepository {
  final ApiClient _client;
  SaleRepository(this._client);

  Future<List<Sale>> getAllSales() {
    return _client.request(
      (dio) => dio.get('/getAllSales'),
      (data) => (data as List).map((e) => Sale.fromJson(e)).toList(),
    );
  }

  Future<Sale> createSale(NewSaleRequest req) {
    return _client.request(
      (dio) => dio.post('/createSale', data: req.toJson()),
      (data) => Sale.fromJson(data['sale']),
    );
  }

  Future<void> removeSale(String saleId) {
    return _client.request(
      (dio) => dio.get('/removeSale', queryParameters: {'saleId': saleId}),
      (_) => null,
    );
  }

  Future<List<Sale>> getSalesByCustomer(String customerId) {
    return _client.request(
      (dio) => dio.get(
        '/getSaleByCustomer',
        queryParameters: {'customerId': customerId},
      ),
      (data) => (data as List).map((e) => Sale.fromJson(e)).toList(),
    );
  }
}

final saleRepositoryProvider = Provider<SaleRepository>((ref) {
  return SaleRepository(ref.watch(apiClientProvider));
});
