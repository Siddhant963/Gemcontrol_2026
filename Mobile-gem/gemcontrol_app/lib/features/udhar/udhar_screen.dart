import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/udhar.dart';
import '../../core/repositories/payment_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/gold_divider.dart';

final allUdharProvider = FutureProvider.autoDispose<List<Udhar>>((ref) {
  return ref.watch(udharRepositoryProvider).getAllUdhar();
});

final allUdharSettlementsProvider = FutureProvider.autoDispose<List<UdharSettlement>>((ref) {
  return ref.watch(udharRepositoryProvider).getAllSettlements();
});

class UdharScreen extends ConsumerStatefulWidget {
  const UdharScreen({super.key});

  @override
  ConsumerState<UdharScreen> createState() => _UdharScreenState();
}

class _UdharScreenState extends ConsumerState<UdharScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(
        title: 'Udhar Management',
        bottom: TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'Outstanding'), Tab(text: 'Settlements')],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_OutstandingTab(), _SettlementsTab()],
      ),
    );
  }
}

/// One customer's aggregated outstanding position — a customer can have more
/// than one still-open credit sale (Udhar record) at once.
class _CustomerUdhar {
  final String customerId;
  final String customerName;
  final List<Udhar> entries;
  const _CustomerUdhar({
    required this.customerId,
    required this.customerName,
    required this.entries,
  });

  double get totalOutstanding => entries.fold(0, (a, u) => a + u.amount);
}

List<_CustomerUdhar> _groupByCustomer(List<Udhar> outstanding) {
  final byCustomer = <String, _CustomerUdhar>{};
  for (final u in outstanding) {
    final key = u.customerId.isNotEmpty ? u.customerId : (u.customerName ?? '-');
    final existing = byCustomer[key];
    if (existing == null) {
      byCustomer[key] = _CustomerUdhar(
        customerId: u.customerId,
        customerName: u.customerName ?? '-',
        entries: [u],
      );
    } else {
      existing.entries.add(u);
    }
  }
  final customers = byCustomer.values.toList()
    ..sort((a, b) => b.totalOutstanding.compareTo(a.totalOutstanding));
  return customers;
}

class _OutstandingTab extends ConsumerWidget {
  const _OutstandingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final udharAsync = ref.watch(allUdharProvider);
    return AsyncValueWidget<List<Udhar>>(
      value: udharAsync,
      onRetry: () => ref.invalidate(allUdharProvider),
      isEmpty: (d) => d.where((u) => u.amount > 0).isEmpty,
      emptyWidget: const EmptyState(icon: Icons.credit_score_outlined, message: 'No outstanding udhar.'),
      data: (all) {
        final customers = _groupByCustomer(all.where((u) => u.amount > 0).toList());
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: customers.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final c = customers[i];
            return Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            c.customerName,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            c.entries.length == 1 ? '1 invoice' : '${c.entries.length} invoices',
                            style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Text(
                        formatInr(c.totalOutstanding, decimals: false),
                        textAlign: TextAlign.center,
                        style: AppTheme.numericData(context).copyWith(color: AppColors.error),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    OutlinedButton(
                      onPressed: () => showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        useSafeArea: true,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
                        ),
                        builder: (_) => _CustomerUdharSheet(
                          customerId: c.customerId,
                          customerName: c.customerName,
                        ),
                      ),
                      child: const Text('View'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

/// Full credit history for one customer: every still-open invoice (with a
/// per-invoice Settle button) plus the complete payment history, including
/// invoices that have since been fully settled.
class _CustomerUdharSheet extends ConsumerWidget {
  final String customerId;
  final String customerName;
  const _CustomerUdharSheet({required this.customerId, required this.customerName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final udharAsync = ref.watch(allUdharProvider);
    final settlementsAsync = ref.watch(allUdharSettlementsProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(customerName, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: AppSpacing.md),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    Text('Outstanding Invoices', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: AppSpacing.sm),
                    udharAsync.when(
                      data: (all) {
                        final entries = all
                            .where((u) => u.customerId == customerId && u.amount > 0)
                            .toList()
                          ..sort((a, b) => (b.udharDate ?? DateTime(0)).compareTo(a.udharDate ?? DateTime(0)));
                        if (entries.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Text(
                              'No outstanding invoices — fully settled.',
                              style: TextStyle(color: AppColors.onSurfaceVariant),
                            ),
                          );
                        }
                        return Column(
                          children: [
                            for (final u in entries) ...[
                              _UdharEntryTile(udhar: u, settlementsAsync: settlementsAsync),
                              const SizedBox(height: AppSpacing.sm),
                            ],
                          ],
                        );
                      },
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (_, __) => const Text('Failed to load outstanding invoices.'),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text('Payment History', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: AppSpacing.sm),
                    settlementsAsync.when(
                      data: (all) {
                        final history = all.where((s) => s.customerId == customerId).toList()
                          ..sort((a, b) => (b.paymentDate ?? DateTime(0)).compareTo(a.paymentDate ?? DateTime(0)));
                        if (history.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Text(
                              'No payments recorded yet.',
                              style: TextStyle(color: AppColors.onSurfaceVariant),
                            ),
                          );
                        }
                        return Column(
                          children: [
                            for (var i = 0; i < history.length; i++) ...[
                              if (i > 0) const GoldDivider(),
                              ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  history[i].invoiceNumber?.isNotEmpty == true
                                      ? history[i].invoiceNumber!
                                      : 'Invoice',
                                ),
                                subtitle: Text(formatDateTime(history[i].paymentDate)),
                                trailing: Text(
                                  formatInr(history[i].amount, decimals: false),
                                  style: AppTheme.numericData(
                                    context,
                                  ).copyWith(color: AppColors.success, fontSize: 15),
                                ),
                              ),
                            ],
                          ],
                        );
                      },
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (_, __) => const Text('Failed to load payment history.'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// One still-open invoice: taken / paid-so-far / remaining, and its own
/// Settle button.
class _UdharEntryTile extends ConsumerWidget {
  final Udhar udhar;
  final AsyncValue<List<UdharSettlement>> settlementsAsync;
  const _UdharEntryTile({required this.udhar, required this.settlementsAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paidSoFar =
        settlementsAsync.valueOrNull
            ?.where((s) => s.udharId == udhar.id)
            .fold<double>(0, (a, s) => a + s.amount) ??
        0;
    final original = udhar.amount + paidSoFar;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm + 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    udhar.invoiceNumber?.isNotEmpty == true ? udhar.invoiceNumber! : 'Invoice',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  'Taken ${formatDate(udhar.udharDate)}',
                  style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _AmountStat(label: 'Taken', value: original, color: AppColors.onSurfaceVariant),
                _AmountStat(label: 'Paid', value: paidSoFar, color: AppColors.success),
                _AmountStat(label: 'Remaining', value: udhar.amount, color: AppColors.error),
              ],
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton(
                onPressed: () => _showSettleDialog(context, ref, udhar),
                child: const Text('Settle'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettleDialog(BuildContext context, WidgetRef ref, Udhar udhar) {
    final ctrl = TextEditingController(text: udhar.amount.toStringAsFixed(2));
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Settle ${udhar.invoiceNumber?.isNotEmpty == true ? udhar.invoiceNumber! : "udhar"}',
        ),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Amount received (₹)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final amount = double.tryParse(ctrl.text) ?? 0;
              if (amount <= 0) return;
              try {
                await ref.read(udharRepositoryProvider).settleUdhar(udhar.id, amount);
                ref.invalidate(allUdharProvider);
                ref.invalidate(allUdharSettlementsProvider);
              } on ApiException catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.message)));
                }
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Settle'),
          ),
        ],
      ),
    );
  }
}

class _AmountStat extends StatelessWidget {
  final String label;
  final double value;
  final Color color;
  const _AmountStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
          Text(
            formatInr(value, decimals: false),
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}

class _SettlementsTab extends ConsumerWidget {
  const _SettlementsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settlementsAsync = ref.watch(allUdharSettlementsProvider);
    return AsyncValueWidget<List<UdharSettlement>>(
      value: settlementsAsync,
      onRetry: () => ref.invalidate(allUdharSettlementsProvider),
      isEmpty: (d) => d.isEmpty,
      emptyWidget: const EmptyState(icon: Icons.history_outlined, message: 'No settlements yet.'),
      data: (all) {
        final sorted = [...all]
          ..sort((a, b) => (b.paymentDate ?? DateTime(0)).compareTo(a.paymentDate ?? DateTime(0)));
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: sorted.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final s = sorted[i];
            return Card(
              child: ListTile(
                title: Text(s.customerName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(
                  s.invoiceNumber?.isNotEmpty == true
                      ? '${s.invoiceNumber} · ${formatDateTime(s.paymentDate)}'
                      : formatDateTime(s.paymentDate),
                ),
                trailing: Text(
                  formatInr(s.amount),
                  style: AppTheme.numericData(context).copyWith(color: AppColors.success),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
