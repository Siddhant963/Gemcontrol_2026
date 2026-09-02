import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/repositories/dashboard_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/gold_divider.dart';

final _selectedDateProvider = StateProvider.autoDispose<DateTime>((ref) => DateTime.now());

final dayBookProvider = FutureProvider.autoDispose<DayBookData>((ref) {
  final date = ref.watch(_selectedDateProvider);
  return ref.watch(dashboardRepositoryProvider).getDayBook(date);
});

class DayBookScreen extends ConsumerWidget {
  const DayBookScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final date = ref.watch(_selectedDateProvider);
    final dayBookAsync = ref.watch(dayBookProvider);

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(
        title: 'Day Book',
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today_outlined),
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: date,
                firstDate: DateTime(2020),
                lastDate: DateTime.now(),
              );
              if (picked != null) ref.read(_selectedDateProvider.notifier).state = picked;
            },
          ),
        ],
      ),
      body: AsyncValueWidget<DayBookData>(
        value: dayBookAsync,
        onRetry: () => ref.invalidate(dayBookProvider),
        data: (data) => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            Text(formatDate(data.date), style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.md),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _summaryRow('Sales Count', '${data.summary['salesCount'] ?? 0}'),
                    _summaryRow('Total Sales', formatInr((data.summary['totalSalesAmount'] as num?) ?? 0)),
                    _summaryRow('Payments Received', formatInr((data.summary['totalPaymentsReceived'] as num?) ?? 0)),
                    _summaryRow('New Stock Added', '${data.summary['newStockCount'] ?? 0}'),
                    _summaryRow('Udhar Given', formatInr((data.summary['udharGivenAmount'] as num?) ?? 0)),
                    _summaryRow('Udhar Settled', formatInr((data.summary['udharSettledAmount'] as num?) ?? 0)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            if (data.paymentsByMode.isNotEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Payments By Mode', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: AppSpacing.sm),
                      for (final entry in data.paymentsByMode.entries)
                        _summaryRow(entry.key, formatInr((entry.value as num?) ?? 0)),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: AppSpacing.md),
            _ListSection(title: 'Sales (${data.sales.length})', items: data.sales, icon: Icons.receipt_long_outlined),
            _ListSection(title: 'New Stock (${data.newStock.length})', items: data.newStock, icon: Icons.inventory_2_outlined),
            _ListSection(title: 'Udhar Given (${data.udharGiven.length})', items: data.udharGiven, icon: Icons.credit_score_outlined),
            _ListSection(title: 'Udhar Settled (${data.udharSettled.length})', items: data.udharSettled, icon: Icons.check_circle_outline),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant)),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      );
}

class _ListSection extends StatelessWidget {
  final String title;
  final List<dynamic> items;
  final IconData icon;
  const _ListSection({required this.title, required this.items, required this.icon});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: AppSpacing.sm),
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0) const GoldDivider(),
                _EntryRow(icon: icon, entry: items[i]),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EntryRow extends StatelessWidget {
  final IconData icon;
  final dynamic entry;
  const _EntryRow({required this.icon, required this.entry});

  @override
  Widget build(BuildContext context) {
    final map = entry is Map ? entry as Map : {};
    final label = map['name'] ?? map['invoiceNumber'] ?? map['customer']?['name'] ?? 'Entry';
    final amount = map['amount'] ?? map['totalAmount'] ?? map['price'];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 8),
          Expanded(child: Text('$label', maxLines: 1, overflow: TextOverflow.ellipsis)),
          if (amount != null) Text(formatInr(amount as num, decimals: false)),
        ],
      ),
    );
  }
}
