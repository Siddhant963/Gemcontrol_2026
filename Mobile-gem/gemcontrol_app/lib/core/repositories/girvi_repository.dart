import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/girvi.dart';

class GirviRepository {
  final ApiClient _client;
  GirviRepository(this._client);

  Future<List<Girvi>> getAllGirviItems() {
    return _client.request(
      (dio) => dio.get('/getAllGirviItems'),
      (data) => (data as List).map((e) => Girvi.fromJson(e)).toList(),
    );
  }

  Future<Girvi> addGirviItem({
    required String itemName,
    required String itemType,
    required double itemWeight,
    required double itemValue,
    double? principalAmount,
    required String itemDescription,
    required double interestRate,
    required String customerId,
    required String firmId,
    required DateTime lastDateToTake,
    required String imagePath,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/AddGirviItem',
        data: FormData.fromMap({
          'itemName': itemName,
          'itemType': itemType,
          'itemWeight': itemWeight,
          'itemValue': itemValue,
          'principalAmount': principalAmount ?? itemValue,
          'itemDescription': itemDescription,
          'interestRate': interestRate,
          'Customer': customerId,
          'firm': firmId,
          'lastDateToTake': lastDateToTake.toIso8601String(),
          'girviItemImg': MultipartFile.fromFileSync(imagePath),
        }),
      ),
      (data) => Girvi.fromJson(data['gierviItem']),
    );
  }

  Future<void> removeGirviItem(String girviItemId) {
    return _client.request(
      (dio) => dio.get(
        '/removeGirviItem',
        queryParameters: {'girviItemId': girviItemId},
      ),
      (_) => null,
    );
  }

  Future<void> changeLastDateToTake(String girviItemId, DateTime newDate) {
    return _client.request(
      (dio) => dio.post(
        '/changelastdatetoTake',
        data: {
          'gierviItemId': girviItemId,
          'newLastDate': newDate.toIso8601String(),
        },
      ),
      (_) => null,
    );
  }

  Future<Map<String, dynamic>> calculateInterest(String girviId) {
    return _client.request(
      (dio) => dio.get('/calculateGirviInterest/$girviId'),
      (data) => data as Map<String, dynamic>,
    );
  }

  Future<void> addPayment({
    required String girviId,
    required double amount,
    required String paymentMethod,
    String? paymentReference,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/addGirviPayment',
        data: {
          'girviId': girviId,
          'amount': amount,
          'paymentMethod': paymentMethod,
          'paymentReference': paymentReference,
        },
      ),
      (_) => null,
    );
  }

  Future<List<GirviInterestRecord>> getInterestHistory(String girviId) {
    return _client.request(
      (dio) => dio.get('/getGirviInterestHistory/$girviId'),
      (data) =>
          (data as List).map((e) => GirviInterestRecord.fromJson(e)).toList(),
    );
  }

  Future<List<Girvi>> getAllPendingInterests() {
    return _client.request(
      (dio) => dio.get('/getAllPendingInterests'),
      (data) => (data as List)
          .map((e) => Girvi.fromJson(e['girvi'] as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<void> redeemItem({
    required String girviId,
    required String paymentMethod,
    String? paymentReference,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/redeemGirviItem',
        data: {
          'girviId': girviId,
          'paymentMethod': paymentMethod,
          'paymentReference': paymentReference,
        },
      ),
      (_) => null,
    );
  }

  Future<List<GirviSummaryRow>> getSummary() {
    return _client.request(
      (dio) => dio.get('/getGirviSummary'),
      (data) => (data['summary'] as List)
          .map((e) => GirviSummaryRow.fromJson(e))
          .toList(),
    );
  }
}

final girviRepositoryProvider = Provider<GirviRepository>((ref) {
  return GirviRepository(ref.watch(apiClientProvider));
});
