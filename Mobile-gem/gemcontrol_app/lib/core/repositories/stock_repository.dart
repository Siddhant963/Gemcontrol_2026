import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/stock.dart';

class StockFields {
  final String name;
  final String materialType;
  final String stockType;
  final double grossWeight;
  final double lessWeight;
  final String karat;
  final String categoryId;
  final String firmId;
  final double quantity;
  final double price;
  final double wastageSupplier;
  final double wastageCustomer;
  final double makingChargeValue;
  final String makingChargeUnit;
  final double labourChargeValue;
  final String labourChargeUnit;
  final double stoneCharge;
  final String hsnCode;

  StockFields({
    required this.name,
    required this.materialType,
    required this.stockType,
    required this.grossWeight,
    required this.lessWeight,
    required this.karat,
    required this.categoryId,
    required this.firmId,
    required this.quantity,
    required this.price,
    required this.wastageSupplier,
    required this.wastageCustomer,
    required this.makingChargeValue,
    required this.makingChargeUnit,
    required this.labourChargeValue,
    required this.labourChargeUnit,
    required this.stoneCharge,
    required this.hsnCode,
  });

  double get netWeight => (grossWeight - lessWeight).clamp(0, double.infinity);

  Map<String, dynamic> toMap() => {
    'name': name,
    'materialgitType': materialType,
    'stockType': stockType,
    'waight': grossWeight,
    'grossWeight': grossWeight,
    'lessWeight': lessWeight,
    'karat': karat,
    'category': categoryId,
    'firm': firmId,
    'quantity': quantity,
    'price': price,
    'wastageSupplier': wastageSupplier,
    'wastageCustomer': wastageCustomer,
    'makingCharge': makingChargeValue,
    'makingChargeValue': makingChargeValue,
    'makingChargeUnit': makingChargeUnit,
    'labourChargeValue': labourChargeValue,
    'labourChargeUnit': labourChargeUnit,
    'stoneCharge': stoneCharge,
    'hsnCode': hsnCode,
  };
}

class StockRepository {
  final ApiClient _client;
  StockRepository(this._client);

  Future<List<Stock>> getAllStocks() {
    return _client.request(
      (dio) => dio.get('/getAllStocks'),
      (data) => (data as List).map((e) => Stock.fromJson(e)).toList(),
    );
  }

  Future<Stock> addStock(StockFields fields, {String? imagePath}) {
    return _client.request(
      (dio) => dio.post(
        '/Addstock',
        data: FormData.fromMap({
          ...fields.toMap(),
          if (imagePath != null) 'stock': MultipartFile.fromFileSync(imagePath),
        }),
      ),
      (data) => Stock.fromJson(data['stock']),
    );
  }

  Future<Stock> updateStock(
    String stockId,
    StockFields fields, {
    String? imagePath,
  }) {
    return _client.request(
      (dio) => dio.put(
        '/updateStock/$stockId',
        data: FormData.fromMap({
          ...fields.toMap(),
          if (imagePath != null) 'stock': MultipartFile.fromFileSync(imagePath),
        }),
      ),
      (data) => Stock.fromJson(data['stock']),
    );
  }

  Future<void> removeStock(String stockId) {
    return _client.request(
      (dio) => dio.get('/removeStock', queryParameters: {'stockId': stockId}),
      (_) => null,
    );
  }
}

final stockRepositoryProvider = Provider<StockRepository>((ref) {
  return StockRepository(ref.watch(apiClientProvider));
});
