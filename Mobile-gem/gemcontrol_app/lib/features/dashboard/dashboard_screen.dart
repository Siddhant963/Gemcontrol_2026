import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_state.dart';
import '../../core/repositories/dashboard_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/gold_divider.dart';
import 'dashboard_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dataAsync = ref.watch(dashboardDataProvider);
    final monthlyAsync = ref.watch(monthlySalesProvider);
    final activitiesAsync = ref.watch(recentActivitiesProvider);
    final session = ref.watch(authControllerProvider).valueOrNull;

    return Scaffold(
      appBar: GcAppBar(
        title: 'Dashboard',
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardDataProvider);
          ref.invalidate(monthlySalesProvider);
          ref.invalidate(recentActivitiesProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            if (session?.role != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Text(
                  'Welcome back, ${session!.isAdmin ? "Admin" : "Team"}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            AsyncValueWidget<DashboardData>(
              value: dataAsync,
              onRetry: () => ref.invalidate(dashboardDataProvider),
              data: (d) => _StatsGrid(data: d),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Monthly Revenue', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              height: 220,
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 20, 20, 12),
                  child: AsyncValueWidget<List<MonthlySales>>(
                    value: monthlyAsync,
                    onRetry: () => ref.invalidate(monthlySalesProvider),
                    data: (months) => _RevenueChart(months: months),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Recent Activity', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.sm),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: AsyncValueWidget(
                  value: activitiesAsync,
                  onRetry: () => ref.invalidate(recentActivitiesProvider),
                  isEmpty: (data) => data.isEmpty,
                  emptyWidget: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Text(
                      'No recent activity',
                      style: TextStyle(color: AppColors.onSurfaceVariant),
                    ),
                  ),
                  data: (activities) => Column(
                    children: [
                      for (var i = 0; i < activities.length; i++) ...[
                        if (i > 0) const GoldDivider(),
                        _ActivityRow(activity: activities[i]),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final DashboardData data;
  const _StatsGrid({required this.data});

  @override
  Widget build(BuildContext context) {
    final tiles = [
      _StatTile(
        label: 'Total Revenue',
        value: formatInr(data.totalSales, decimals: false),
        icon: Icons.payments_outlined,
      ),
      _StatTile(
        label: 'Sales Count',
        value: '${data.totalSalesCount}',
        icon: Icons.receipt_long_outlined,
      ),
      _StatTile(
        label: 'Customers',
        value: '${data.totalCustomers}',
        icon: Icons.people_outline,
      ),
      _StatTile(
        label: 'Stock Value',
        value: formatInr(data.totalStockValue, decimals: false),
        icon: Icons.inventory_2_outlined,
      ),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.sm,
      crossAxisSpacing: AppSpacing.sm,
      childAspectRatio: 1.5,
      children: tiles,
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _StatTile({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: AppColors.primary, size: 22),
            Text(
              value,
              style: AppTheme.numericData(context),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _RevenueChart extends StatelessWidget {
  final List<MonthlySales> months;
  const _RevenueChart({required this.months});

  @override
  Widget build(BuildContext context) {
    if (months.isEmpty) {
      return const Center(
        child: Text('No sales data yet', style: TextStyle(color: AppColors.onSurfaceVariant)),
      );
    }
    final maxY = months.map((m) => m.totalRevenue).fold<double>(0, (a, b) => a > b ? a : b);
    return BarChart(
      BarChartData(
        maxY: maxY == 0 ? 10 : maxY * 1.2,
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final i = value.toInt();
                if (i < 0 || i >= months.length) return const SizedBox();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    months[i].month.substring(0, 3),
                    style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant),
                  ),
                );
              },
            ),
          ),
        ),
        barGroups: [
          for (var i = 0; i < months.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: months[i].totalRevenue,
                  color: AppColors.primaryContainer,
                  width: 22,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  final dynamic activity;
  const _ActivityRow({required this.activity});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.circle, size: 6, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(activity.description, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
