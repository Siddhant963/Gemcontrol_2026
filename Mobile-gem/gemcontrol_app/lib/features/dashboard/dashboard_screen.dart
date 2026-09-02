import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_state.dart';
import '../../core/repositories/dashboard_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'dashboard_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dataAsync = ref.watch(dashboardDataProvider);
    final monthlyAsync = ref.watch(monthlySalesProvider);
    final session = ref.watch(authControllerProvider).valueOrNull;

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Dashboard', showAppActions: true),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardDataProvider);
          ref.invalidate(monthlySalesProvider);
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
              data: (d) => _StatsRow(data: d),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Monthly Revenue', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.sm),
            AsyncValueWidget<List<MonthlySales>>(
              value: monthlyAsync,
              onRetry: () => ref.invalidate(monthlySalesProvider),
              data: (months) => IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: _ChartCard(label: 'By Month', child: _RevenueChart(months: months)),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: _ChartCard(
                        label: 'Share of Total',
                        child: _RevenuePieChart(months: months),
                      ),
                    ),
                  ],
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

/// The 4 headline numbers in a single row, per the simplified dashboard —
/// no more 2x2 grid. Each tile shrinks its value to fit so large rupee
/// figures never wrap or overflow.
class _StatsRow extends StatelessWidget {
  final DashboardData data;
  const _StatsRow({required this.data});

  @override
  Widget build(BuildContext context) {
    final tiles = [
      _StatTile(
        label: 'Total Revenue',
        value: formatInrCompact(data.totalSales),
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
        value: formatInrCompact(data.totalStockValue),
        icon: Icons.inventory_2_outlined,
      ),
    ];
    return IntrinsicHeight(
      child: Row(
        children: [
          for (var i = 0; i < tiles.length; i++) ...[
            if (i > 0) const SizedBox(width: AppSpacing.xs),
            Expanded(child: tiles[i]),
          ],
        ],
      ),
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
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: AppColors.primary, size: 18),
            const SizedBox(height: 6),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(value, style: AppTheme.numericData(context)),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

/// Fixed-height card wrapper shared by the two charts so they line up in
/// the same row.
class _ChartCard extends StatelessWidget {
  final String label;
  final Widget child;
  const _ChartCard({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
          child: Column(
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
              const SizedBox(height: 4),
              Expanded(child: child),
            ],
          ),
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

/// Each month's share of the total revenue across the period shown in
/// [_RevenueChart], as a pie chart — same underlying data, proportion view
/// instead of trend view.
class _RevenuePieChart extends StatelessWidget {
  final List<MonthlySales> months;
  const _RevenuePieChart({required this.months});

  static const _palette = [
    AppColors.primary,
    AppColors.primaryContainer,
    AppColors.secondary,
    AppColors.tertiary,
    AppColors.success,
  ];

  @override
  Widget build(BuildContext context) {
    final total = months.fold<double>(0, (a, m) => a + m.totalRevenue);
    if (months.isEmpty || total <= 0) {
      return const Center(
        child: Text('No sales data yet', style: TextStyle(color: AppColors.onSurfaceVariant)),
      );
    }
    return Column(
      children: [
        Expanded(
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 22,
              sections: [
                for (var i = 0; i < months.length; i++)
                  PieChartSectionData(
                    value: months[i].totalRevenue,
                    color: _palette[i % _palette.length],
                    title: '${(months[i].totalRevenue / total * 100).round()}%',
                    radius: 36,
                    titleStyle: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.onPrimary,
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 2,
          alignment: WrapAlignment.center,
          children: [
            for (var i = 0; i < months.length; i++)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: _palette[i % _palette.length],
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 3),
                  Text(
                    months[i].month.substring(0, 3),
                    style: const TextStyle(fontSize: 9, color: AppColors.onSurfaceVariant),
                  ),
                ],
              ),
          ],
        ),
      ],
    );
  }
}
