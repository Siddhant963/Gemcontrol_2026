import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/girvi.dart';
import '../../core/repositories/girvi_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/gold_divider.dart';
import '../../shared/widgets/status_chip.dart';
import 'girvi_providers.dart';

class GirviDetailSheet extends ConsumerStatefulWidget {
  final Girvi girvi;
  const GirviDetailSheet({super.key, required this.girvi});

  @override
  ConsumerState<GirviDetailSheet> createState() => _GirviDetailSheetState();
}

class _GirviDetailSheetState extends ConsumerState<GirviDetailSheet> {
  Map<String, dynamic>? _interestPreview;
  List<GirviInterestRecord> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(girviRepositoryProvider);
      final preview = await repo.calculateInterest(widget.girvi.id);
      final history = await repo.getInterestHistory(widget.girvi.id);
      if (mounted) {
        setState(() {
          _interestPreview = preview;
          _history = history;
        });
      }
    } catch (_) {
      // Preview/history are supplementary — the core item details below still render.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final g = widget.girvi;
    final projected = _interestPreview?['interestCalculation'] as Map<String, dynamic>?;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(g.itemName, style: Theme.of(context).textTheme.headlineSmall)),
              StatusChip(label: g.status),
            ],
          ),
          Text('${g.customerName ?? "-"} · ${g.itemType} · ${g.itemWeight}g',
              style: const TextStyle(color: AppColors.onSurfaceVariant)),
          const GoldDivider(),
          _row('Principal Amount', formatInr(g.principalAmount)),
          _row('Outstanding Principal', formatInr(g.outstandingPrincipal)),
          _row('Accrued Interest', formatInr(g.accruedInterest)),
          _row('Current Outstanding', formatInr(g.currentOutstandingAmount), emphasize: true),
          _row('Interest Rate', '${g.interestRate}% / month'),
          _row('Last Date To Take', formatDate(g.lastDateToTake)),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (projected != null) ...[
            const GoldDivider(),
            Text('As of today', style: Theme.of(context).textTheme.labelMedium),
            _row('Months Elapsed', '${projected['monthsElapsed']}'),
            _row('Projected Interest', formatInr((projected['interestAmount'] as num?) ?? 0)),
            _row(
              'Projected Total Outstanding',
              formatInr((projected['projectedOutstandingTotal'] as num?) ?? 0),
              emphasize: true,
            ),
          ],
          if (g.payments.isNotEmpty) ...[
            const GoldDivider(),
            Text('Payment History', style: Theme.of(context).textTheme.labelMedium),
            for (final p in g.payments)
              _row(
                '${formatDate(p.date)} · ${p.method}',
                '${formatInr(p.amount)} (int ${formatInr(p.interestPortion)})',
              ),
          ],
          if (_history.isNotEmpty) ...[
            const GoldDivider(),
            Text('Monthly Interest Ledger', style: Theme.of(context).textTheme.labelMedium),
            for (final rec in _history)
              _row(
                '${formatDate(rec.calculationDate)} · ${rec.status}',
                formatInr(rec.interestAmount),
              ),
          ],
          const SizedBox(height: AppSpacing.lg),
          if (g.status == 'active') ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showPaymentDialog(context),
                    child: const Text('Add Payment'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showDateDialog(context),
                    child: const Text('Extend Date'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            ElevatedButton(
              onPressed: () => _showRedeemDialog(context),
              child: const Text('Redeem Item'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _row(String label, String value, {bool emphasize = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
            Text(
              value,
              style: emphasize ? AppTheme.numericData(context) : const TextStyle(fontSize: 13),
            ),
          ],
        ),
      );

  void _showPaymentDialog(BuildContext context) {
    final ctrl = TextEditingController();
    String method = 'cash';
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add Payment'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: ctrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₹)'),
              ),
              const SizedBox(height: AppSpacing.sm),
              DropdownButtonFormField<String>(
                initialValue: method,
                decoration: const InputDecoration(labelText: 'Method'),
                items: const ['cash', 'online', 'bankTransfer', 'upi']
                    .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                    .toList(),
                onChanged: (v) => setDialogState(() => method = v!),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                final amount = double.tryParse(ctrl.text) ?? 0;
                if (amount <= 0) return;
                try {
                  await ref.read(girviRepositoryProvider).addPayment(
                        girviId: widget.girvi.id,
                        amount: amount,
                        paymentMethod: method,
                      );
                  ref.invalidate(girviItemsProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                  if (mounted) Navigator.pop(context);
                } on ApiException catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.message)));
                  }
                }
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDateDialog(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.girvi.lastDateToTake ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 3650)),
    );
    if (picked == null) return;
    await ref.read(girviRepositoryProvider).changeLastDateToTake(widget.girvi.id, picked);
    ref.invalidate(girviItemsProvider);
    if (mounted) Navigator.pop(context);
  }

  void _showRedeemDialog(BuildContext context) {
    String method = 'cash';
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Redeem ${widget.girvi.itemName}?'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Outstanding: ${formatInr(widget.girvi.currentOutstandingAmount)}'),
              const SizedBox(height: AppSpacing.sm),
              DropdownButtonFormField<String>(
                initialValue: method,
                decoration: const InputDecoration(labelText: 'Final payment method'),
                items: const ['cash', 'online', 'bankTransfer', 'upi']
                    .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                    .toList(),
                onChanged: (v) => setDialogState(() => method = v!),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                try {
                  await ref.read(girviRepositoryProvider).redeemItem(
                        girviId: widget.girvi.id,
                        paymentMethod: method,
                      );
                  ref.invalidate(girviItemsProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                  if (mounted) Navigator.pop(context);
                } on ApiException catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.message)));
                  }
                }
              },
              child: const Text('Redeem'),
            ),
          ],
        ),
      ),
    );
  }
}
