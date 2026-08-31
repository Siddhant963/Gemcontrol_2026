import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/payment.dart';
import '../../core/repositories/payment_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/status_chip.dart';

final allPaymentsProvider = FutureProvider.autoDispose<List<Payment>>((ref) {
  return ref.watch(paymentRepositoryProvider).getAllPayments();
});

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final paymentsAsync = ref.watch(allPaymentsProvider);
    return Scaffold(
      appBar: GcAppBar(title: 'Payments Ledger'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: TextField(
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Search by customer, mode...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: AsyncValueWidget<List<Payment>>(
              value: paymentsAsync,
              onRetry: () => ref.invalidate(allPaymentsProvider),
              data: (all) {
                final sorted = [...all]
                  ..sort((a, b) => (b.paymentDate ?? DateTime(0)).compareTo(a.paymentDate ?? DateTime(0)));
                final filtered = _query.isEmpty
                    ? sorted
                    : sorted
                        .where((p) =>
                            (p.customerName ?? '').toLowerCase().contains(_query) ||
                            p.paymentType.toLowerCase().contains(_query))
                        .toList();
                if (filtered.isEmpty) {
                  return const EmptyState(icon: Icons.payments_outlined, message: 'No payments recorded yet.');
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.xl),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) {
                    final p = filtered[i];
                    return Card(
                      child: ListTile(
                        title: Text(p.customerName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(formatDateTime(p.paymentDate)),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(formatInr(p.amount), style: AppTheme.numericData(context)),
                            const SizedBox(height: 4),
                            StatusChip(label: p.paymentType),
                          ],
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
