import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/models/customer.dart';
import '../../core/models/firm.dart';
import '../../core/models/sale.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/sale_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/gold_divider.dart';
import '../customers/customers_providers.dart';
import 'item_picker_sheet.dart';

const _paymentMethods = ['cash', 'card', 'online', 'bankTransfer', 'Upi', 'cheque'];

class NewSaleScreen extends ConsumerStatefulWidget {
  const NewSaleScreen({super.key});

  @override
  ConsumerState<NewSaleScreen> createState() => _NewSaleScreenState();
}

class _SplitPayment {
  String method;
  final TextEditingController amountCtrl;
  _SplitPayment(this.method, [double amount = 0])
      : amountCtrl = TextEditingController(text: amount == 0 ? '' : amount.toStringAsFixed(2));
}

class _NewSaleScreenState extends ConsumerState<NewSaleScreen> {
  final List<SaleItem> _cart = [];
  Customer? _customer;
  String _discountType = 'fixed';
  final _discountCtrl = TextEditingController(text: '0');
  final List<_SplitPayment> _payments = [_SplitPayment('cash')];
  final _udharCtrl = TextEditingController(text: '0');
  bool _submitting = false;

  @override
  void dispose() {
    _discountCtrl.dispose();
    _udharCtrl.dispose();
    for (final p in _payments) {
      p.amountCtrl.dispose();
    }
    _udharCtrl.dispose();
    super.dispose();
  }

  double get _subtotal => _cart.fold(0, (sum, i) => sum + i.amount * i.quantity);

  double get _discountValue => double.tryParse(_discountCtrl.text) ?? 0;

  double get _discountAmount =>
      _discountType == 'percent' ? _subtotal * _discountValue / 100 : _discountValue;

  double get _taxableAmount => (_subtotal - _discountAmount).clamp(0, double.infinity);

  double get _paymentsTotal =>
      _payments.fold(0, (sum, p) => sum + (double.tryParse(p.amountCtrl.text) ?? 0));

  double get _udharAmount => double.tryParse(_udharCtrl.text) ?? 0;

  @override
  Widget build(BuildContext context) {
    final firm = ref.watch(currentFirmProvider);
    final gst = firm?.gstConfig;
    final cgstAmount = gst != null ? _taxableAmount * gst.cgstRate / 100 : 0.0;
    final sgstAmount = gst != null ? _taxableAmount * gst.sgstRate / 100 : 0.0;
    final igstAmount = gst != null ? _taxableAmount * gst.igstRate / 100 : 0.0;
    final totalAmount = _taxableAmount + cgstAmount + sgstAmount + igstAmount;
    final remaining = totalAmount - _paymentsTotal - _udharAmount;

    return Scaffold(
      appBar: AppBar(title: const Text('New Sale')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          _SectionCard(
            title: 'Customer',
            child: Consumer(
              builder: (context, ref, _) {
                final customersAsync = ref.watch(customersProvider);
                return customersAsync.when(
                  data: (customers) => DropdownButtonFormField<Customer>(
                    initialValue: _customer,
                    decoration: const InputDecoration(hintText: 'Select customer'),
                    items: customers
                        .map((c) => DropdownMenuItem(value: c, child: Text('${c.name} · ${c.contact}')))
                        .toList(),
                    onChanged: (v) => setState(() => _customer = v),
                  ),
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => const Text('Could not load customers'),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _SectionCard(
            title: 'Items',
            trailing: TextButton.icon(
              onPressed: () async {
                final item = await showModalBottomSheet<SaleItem>(
                  context: context,
                  isScrollControlled: true,
                  useSafeArea: true,
                  builder: (_) => const ItemPickerSheet(),
                );
                if (item != null) setState(() => _cart.add(item));
              },
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add'),
            ),
            child: _cart.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Text('No items added yet', style: TextStyle(color: AppColors.onSurfaceVariant)),
                  )
                : Column(
                    children: [
                      for (var i = 0; i < _cart.length; i++) ...[
                        if (i > 0) const GoldDivider(),
                        _CartRow(
                          item: _cart[i],
                          onChanged: (updated) => setState(() => _cart[i] = updated),
                          onRemove: () => setState(() => _cart.removeAt(i)),
                        ),
                      ],
                    ],
                  ),
          ),
          const SizedBox(height: AppSpacing.md),
          _SectionCard(
            title: 'Discount',
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _discountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Value'),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'fixed', label: Text('₹')),
                    ButtonSegment(value: 'percent', label: Text('%')),
                  ],
                  selected: {_discountType},
                  onSelectionChanged: (s) => setState(() => _discountType = s.first),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _SectionCard(
            title: 'Summary',
            child: Column(
              children: [
                _SummaryRow('Subtotal', formatInr(_subtotal)),
                _SummaryRow('Discount', '- ${formatInr(_discountAmount)}'),
                _SummaryRow('Taxable Amount', formatInr(_taxableAmount)),
                if (gst != null && gst.enabled) ...[
                  _SummaryRow('CGST (${gst.cgstRate}%)', formatInr(cgstAmount)),
                  _SummaryRow('SGST (${gst.sgstRate}%)', formatInr(sgstAmount)),
                  if (gst.igstRate > 0) _SummaryRow('IGST (${gst.igstRate}%)', formatInr(igstAmount)),
                ],
                const GoldDivider(),
                _SummaryRow('Total Amount', formatInr(totalAmount), emphasize: true),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _SectionCard(
            title: 'Payment',
            trailing: TextButton.icon(
              onPressed: () => setState(() => _payments.add(_SplitPayment('cash'))),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Split'),
            ),
            child: Column(
              children: [
                for (var i = 0; i < _payments.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: DropdownButtonFormField<String>(
                            initialValue: _payments[i].method,
                            decoration: const InputDecoration(labelText: 'Mode'),
                            items: _paymentMethods
                                .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                                .toList(),
                            onChanged: (v) => setState(() => _payments[i].method = v!),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: TextField(
                            controller: _payments[i].amountCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: '₹'),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        if (_payments.length > 1)
                          IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () => setState(() => _payments.removeAt(i)),
                          ),
                      ],
                    ),
                  ),
                TextField(
                  controller: _udharCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Udhar (credit) amount'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: AppSpacing.sm),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => setState(() {
                      final owed = (totalAmount - _paymentsTotal).clamp(0, double.infinity);
                      _udharCtrl.text = owed.toStringAsFixed(2);
                    }),
                    child: const Text('Fill remaining as udhar'),
                  ),
                ),
                Text(
                  remaining.abs() < 0.01
                      ? 'Fully accounted for'
                      : remaining > 0
                          ? 'Remaining: ${formatInr(remaining)}'
                          : 'Overpaid by ${formatInr(-remaining)}',
                  style: TextStyle(
                    color: remaining.abs() < 0.01 ? AppColors.success : AppColors.error,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton(
            onPressed: _submitting ? null : () => _submit(totalAmount, gst, cgstAmount, sgstAmount, igstAmount),
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Complete Sale'),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Future<void> _submit(
    double totalAmount,
    GstConfig? gst,
    double cgstAmount,
    double sgstAmount,
    double igstAmount,
  ) async {
    final firm = ref.read(currentFirmProvider);
    if (_cart.isEmpty || _customer == null || firm == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add a customer and at least one item')),
      );
      return;
    }
    final remaining = totalAmount - _paymentsTotal - _udharAmount;
    if (remaining.abs() > 0.01) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payments + udhar must add up to the total amount')),
      );
      return;
    }
    setState(() => _submitting = true);
    final payments = _payments
        .where((p) => (double.tryParse(p.amountCtrl.text) ?? 0) > 0)
        .map((p) => SalePayment(method: p.method, amount: double.parse(p.amountCtrl.text)))
        .toList();
    final request = NewSaleRequest(
      items: _cart,
      customerId: _customer!.id,
      firmId: firm.id,
      subtotal: _subtotal,
      discount: SaleDiscount(type: _discountType, value: _discountValue, amount: _discountAmount),
      taxableAmount: _taxableAmount,
      gst: SaleGst(
        cgstRate: gst?.cgstRate ?? 0,
        sgstRate: gst?.sgstRate ?? 0,
        igstRate: gst?.igstRate ?? 0,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        igstAmount: igstAmount,
      ),
      totalAmount: totalAmount,
      paymentMethod: payments.length > 1
          ? 'split'
          : (payments.isNotEmpty ? payments.first.method : 'credit'),
      payments: payments,
      udharAmount: _udharAmount,
    );
    try {
      final sale = await ref.read(saleRepositoryProvider).createSale(request);
      if (mounted) context.pushReplacement('/sales/${sale.id}');
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailing;
  const _SectionCard({required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            child,
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool emphasize;
  const _SummaryRow(this.label, this.value, {this.emphasize = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: emphasize ? FontWeight.w700 : FontWeight.normal)),
          Text(
            value,
            style: emphasize
                ? AppTheme.numericData(context)
                : const TextStyle(color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _CartRow extends StatefulWidget {
  final SaleItem item;
  final ValueChanged<SaleItem> onChanged;
  final VoidCallback onRemove;
  const _CartRow({required this.item, required this.onChanged, required this.onRemove});

  @override
  State<_CartRow> createState() => _CartRowState();
}

class _CartRowState extends State<_CartRow> {
  late final TextEditingController _qtyCtrl =
      TextEditingController(text: widget.item.quantity.toString());
  late final TextEditingController _amountCtrl =
      TextEditingController(text: widget.item.amount.toString());

  @override
  void dispose() {
    _qtyCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  void _update() {
    final qty = double.tryParse(_qtyCtrl.text) ?? widget.item.quantity;
    final amount = double.tryParse(_amountCtrl.text) ?? widget.item.amount;
    widget.onChanged(
      SaleItem(
        saleType: widget.item.saleType,
        materialId: widget.item.materialId,
        quantity: qty,
        amount: amount,
        name: widget.item.name,
        hsnCode: widget.item.hsnCode,
        karat: widget.item.karat,
        grossWeight: widget.item.grossWeight,
        lessWeight: widget.item.lessWeight,
        netWeight: widget.item.netWeight,
        rate: widget.item.rate,
        makingCharge: widget.item.makingCharge,
        wastageAmount: widget.item.wastageAmount,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(widget.item.name, style: const TextStyle(fontWeight: FontWeight.w600))),
              IconButton(
                icon: const Icon(Icons.close, size: 18, color: AppColors.error),
                onPressed: widget.onRemove,
              ),
            ],
          ),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _qtyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Qty', isDense: true),
                  onChanged: (_) => _update(),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Amount per unit (₹)', isDense: true),
                  onChanged: (_) => _update(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
