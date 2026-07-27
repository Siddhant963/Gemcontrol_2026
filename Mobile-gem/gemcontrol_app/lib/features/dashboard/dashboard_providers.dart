import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/repositories/dashboard_repository.dart';

final dashboardDataProvider = FutureProvider.autoDispose<DashboardData>((ref) {
  return ref.watch(dashboardRepositoryProvider).getDashboardData();
});

final monthlySalesProvider = FutureProvider.autoDispose<List<MonthlySales>>((ref) {
  return ref.watch(dashboardRepositoryProvider).getMonthlySales();
});

final recentActivitiesProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(dashboardRepositoryProvider).getRecentActivities();
});
