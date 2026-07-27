import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/daily_rate.dart';

class DailyRateRepository {
  final ApiClient _client;
  DailyRateRepository(this._client);

  Future<DailyRate?> getTodayRate() async {
    try {
      return await _client.request(
        (dio) => dio.get('/getTodayDailrate'),
        (data) => DailyRate.fromJson(data),
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<List<DailyRate>> getAllRates() {
    return _client.request(
      (dio) => dio.get('/getAllDailrates'),
      (data) => (data as List).map((e) => DailyRate.fromJson(e)).toList(),
    );
  }

  Future<DailyRate> createRate({
    required DateTime date,
    required double gold24k,
    required double silver,
    required Map<String, double> diamond,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/createDailrate',
        data: {
          'date': date.toIso8601String(),
          'rate': {
            'gold': {'24K': gold24k},
            'silver': silver,
            'daimond': diamond,
          },
        },
      ),
      (data) => DailyRate.fromJson(data['dailrate']),
    );
  }

  Future<DailyRate> updateRate({
    required String id,
    required DateTime date,
    required double gold24k,
    required double silver,
    required Map<String, double> diamond,
  }) {
    return _client.request(
      (dio) => dio.put(
        '/updateDailrate',
        data: {
          '_id': id,
          'date': date.toIso8601String(),
          'rate': {
            'gold': {'24K': gold24k},
            'silver': silver,
            'daimond': diamond,
          },
        },
      ),
      (data) => DailyRate.fromJson(data['dailrate']),
    );
  }
}

final dailyRateRepositoryProvider = Provider<DailyRateRepository>((ref) {
  return DailyRateRepository(ref.watch(apiClientProvider));
});
