import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/activity.dart';

class DashboardData {
  final int totalCustomers;
  final double totalSales;
  final int totalSalesCount;
  final double totalStockValue;
  final double totalRawMaterialWeight;
  final Map<String, dynamic>? todayRate;

  DashboardData({
    required this.totalCustomers,
    required this.totalSales,
    required this.totalSalesCount,
    required this.totalStockValue,
    required this.totalRawMaterialWeight,
    this.todayRate,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
    totalCustomers: (json['totalCustomers'] as num?)?.toInt() ?? 0,
    totalSales: (json['totalSales'] as num?)?.toDouble() ?? 0,
    totalSalesCount: (json['totalSalesCount'] as num?)?.toInt() ?? 0,
    totalStockValue: (json['totalStockValue'] as num?)?.toDouble() ?? 0,
    totalRawMaterialWeight:
        (json['totalRawMaterialWeight'] as num?)?.toDouble() ?? 0,
    todayRate: json['todayRate'] is Map
        ? json['todayRate'] as Map<String, dynamic>
        : null,
  );
}

class MonthlySales {
  final String month;
  final int year;
  final double totalRevenue;

  MonthlySales({required this.month, required this.year, required this.totalRevenue});

  factory MonthlySales.fromJson(Map<String, dynamic> json) => MonthlySales(
    month: json['month'] ?? '',
    year: (json['year'] as num?)?.toInt() ?? 0,
    totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0,
  );
}

class DayBookData {
  final DateTime date;
  final List<dynamic> sales;
  final List<dynamic> payments;
  final Map<String, dynamic> paymentsByMode;
  final List<dynamic> newStock;
  final List<dynamic> udharGiven;
  final List<dynamic> udharSettled;
  final Map<String, dynamic> summary;

  DayBookData({
    required this.date,
    required this.sales,
    required this.payments,
    required this.paymentsByMode,
    required this.newStock,
    required this.udharGiven,
    required this.udharSettled,
    required this.summary,
  });

  factory DayBookData.fromJson(Map<String, dynamic> json) => DayBookData(
    date: json['date'] != null
        ? (DateTime.tryParse(json['date']) ?? DateTime.now())
        : DateTime.now(),
    sales: json['sales'] ?? [],
    payments: json['payments'] ?? [],
    paymentsByMode: (json['paymentsByMode'] as Map<String, dynamic>?) ?? {},
    newStock: json['newStock'] ?? [],
    udharGiven: json['udharGiven'] ?? [],
    udharSettled: json['udharSettled'] ?? [],
    summary: (json['summary'] as Map<String, dynamic>?) ?? {},
  );
}

class DashboardRepository {
  final ApiClient _client;
  DashboardRepository(this._client);

  Future<DashboardData> getDashboardData() {
    return _client.request(
      (dio) => dio.get('/getDashboardData'),
      (data) => DashboardData.fromJson(data),
    );
  }

  Future<List<MonthlySales>> getMonthlySales() {
    return _client.request(
      (dio) => dio.get('/getMonthlySalesData'),
      (data) => (data as List).map((e) => MonthlySales.fromJson(e)).toList(),
    );
  }

  Future<List<ActivityItem>> getRecentActivities() {
    return _client.request(
      (dio) => dio.get('/getRecentActivities'),
      (data) => (data as List).map((e) => ActivityItem.fromJson(e)).toList(),
    );
  }

  Future<DayBookData> getDayBook(DateTime? date) {
    return _client.request(
      (dio) => dio.get(
        '/getDayBook',
        queryParameters: date != null
            ? {'date': date.toIso8601String()}
            : null,
      ),
      (data) => DayBookData.fromJson(data),
    );
  }
}

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref.watch(apiClientProvider));
});
