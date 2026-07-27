import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/udhar.dart';
import '../../core/repositories/payment_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/async_value_widget.dart';

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
      appBar: AppBar(
        title: const Text('Udhar Management'),
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

class _OutstandingTab extends ConsumerWidget {
  const _OutstandingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final udharAsync = ref.watch(allUdharProvider);
    return AsyncValueWidget<List<Udhar>>(
      value: udharAsync,
      onRetry: () => ref.invalidate(allUdharProvider),
      isEmpty: (d) => d.isEmpty,
      emptyWidget: const EmptyState(icon: Icons.credit_score_outlined, message: 'No outstanding udhar.'),
      data: (all) {
        final outstanding = all.where((u) => u.amount > 0).toList()
          ..sort((a, b) => (b.udharDate ?? DateTime(0)).compareTo(a.udharDate ?? DateTime(0)));
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: outstanding.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final u = outstanding[i];
            return Card(
              child: ListTile(
                title: Text(u.customerName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('Since ${formatDate(u.udharDate)}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(formatInr(u.amount), style: AppTheme.numericData(context).copyWith(color: AppColors.error)),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: () => _showSettleDialog(context, ref, u),
                      child: const Text('Settle'),
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

  void _showSettleDialog(BuildContext context, WidgetRef ref, Udhar udhar) {
    final ctrl = TextEditingController(text: udhar.amount.toStringAsFixed(2));
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Settle udhar for ${udhar.customerName ?? "-"}'),
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
                subtitle: Text(formatDateTime(s.paymentDate)),
                trailing: Text(formatInr(s.amount), style: AppTheme.numericData(context).copyWith(color: AppColors.success)),
              ),
            );
          },
        );
      },
    );
  }
}
