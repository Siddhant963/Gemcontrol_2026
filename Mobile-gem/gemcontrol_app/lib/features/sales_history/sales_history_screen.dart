import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/sale.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/status_chip.dart';
import 'sales_history_providers.dart';

class SalesHistoryScreen extends ConsumerStatefulWidget {
  const SalesHistoryScreen({super.key});

  @override
  ConsumerState<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends ConsumerState<SalesHistoryScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final salesAsync = ref.watch(allSalesProvider);
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Sales History', showAppActions: true),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/sales/new'),
        icon: const Icon(Icons.add),
        label: const Text('New Sale'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: TextField(
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Search by customer, invoice#, mode...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: AsyncValueWidget<List<Sale>>(
              value: salesAsync,
              onRetry: () => ref.invalidate(allSalesProvider),
              data: (all) {
                final sorted = [...all]
                  ..sort((a, b) => (b.saleDate ?? DateTime(0)).compareTo(a.saleDate ?? DateTime(0)));
                final filtered = _query.isEmpty
                    ? sorted
                    : sorted
                        .where((s) =>
                            (s.customerName ?? '').toLowerCase().contains(_query) ||
                            s.invoiceNumber.toLowerCase().contains(_query) ||
                            s.paymentMethod.toLowerCase().contains(_query))
                        .toList();
                if (filtered.isEmpty) {
                  return const EmptyState(icon: Icons.receipt_long_outlined, message: 'No sales yet.');
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md,
                    0,
                    AppSpacing.md,
                    AppSpacing.xl + 56,
                  ),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) {
                    final sale = filtered[i];
                    return Card(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(AppRadii.card),
                        onTap: () => context.push('/sales/${sale.id}', extra: sale),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.sm,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      sale.invoiceNumber.isNotEmpty ? sale.invoiceNumber : 'Sale',
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${sale.customerName ?? "-"} · ${formatDate(sale.saleDate)}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    StatusChip(label: sale.paymentMethod),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  formatInr(sale.totalAmount, decimals: false),
                                  textAlign: TextAlign.center,
                                  style: AppTheme.numericData(context),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
                                onPressed: () => context.push('/sales/${sale.id}', extra: sale),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
