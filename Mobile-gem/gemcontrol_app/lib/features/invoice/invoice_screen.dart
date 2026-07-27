import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/firm.dart';
import '../../core/models/sale.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../core/utils/number_to_words.dart';
import '../../shared/widgets/gold_divider.dart';

/// GST invoice layout per the reference "Krishna Jewellers" screenshots
/// (invoice-format-spec memory): header / bill-to / line items / payment +
/// totals block / footer with amount-in-words and signatures.
class InvoiceScreen extends ConsumerWidget {
  final Sale sale;
  const InvoiceScreen({super.key, required this.sale});

  double get _cashReceived => _sumByGroup(sale, {'cash'});
  double get _chequeReceived => _sumByGroup(sale, {'cheque'});
  double get _cardReceived => _sumByGroup(sale, {'card'});
  double get _onlineReceived => _sumByGroup(sale, {'online', 'bankTransfer', 'Upi', 'other'});

  static double _sumByGroup(Sale sale, Set<String> methods) {
    return sale.payments
        .where((p) => methods.contains(p.method))
        .fold(0.0, (sum, p) => sum + p.amount);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final firm = ref.watch(currentFirmProvider);
    final netReceivable = sale.totalAmount - sale.udharAmount;

    return Scaffold(
      appBar: AppBar(title: Text(sale.invoiceNumber.isNotEmpty ? sale.invoiceNumber : 'Invoice')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Header(firm: firm, sale: sale),
                const GoldDivider(),
                const Center(
                  child: Text('GST INVOICE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                ),
                const SizedBox(height: 12),
                _BillTo(sale: sale),
                const SizedBox(height: 16),
                Text('Items', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                _ItemsTable(items: sale.items),
                const GoldDivider(),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _PaymentBlock(sale: this)),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(child: _TotalsBlock(sale: sale, netReceivable: netReceivable)),
                  ],
                ),
                const GoldDivider(),
                Text(
                  'PAYABLE AMOUNT: ${amountInWords(sale.totalAmount)}',
                  style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 13),
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Column(
                      children: [
                        SizedBox(width: 120, child: Divider(color: AppColors.outline)),
                        Text('Customer Signatory', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                    Column(
                      children: [
                        if (firm != null && firm.ownerSignature.isNotEmpty)
                          SizedBox(
                            height: 40,
                            child: CachedNetworkImage(
                              imageUrl: resolveUploadUrl(firm.ownerSignature),
                              errorWidget: (_, __, ___) => const SizedBox(),
                            ),
                          )
                        else
                          const SizedBox(width: 120, height: 40),
                        const SizedBox(
                          width: 120,
                          child: Divider(color: AppColors.outline),
                        ),
                        const Text('Authorized Signatory', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final Firm? firm;
  final Sale sale;
  const _Header({required this.firm, required this.sale});

  @override
  Widget build(BuildContext context) {
    final logo = firm?.logo;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (logo != null && logo.isNotEmpty)
          SizedBox(
            width: 48,
            height: 48,
            child: CachedNetworkImage(
              imageUrl: resolveUploadUrl(logo),
              errorWidget: (_, __, ___) => const SizedBox(),
            ),
          )
        else
          const SizedBox(width: 48),
        Expanded(
          child: Column(
            children: [
              Text(
                firm?.name ?? 'Firm',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              if (firm?.registrationNo != null && firm!.registrationNo.isNotEmpty)
                Text('Reg. No: ${firm!.registrationNo}', style: const TextStyle(fontSize: 11)),
              if (firm?.email != null && firm!.email.isNotEmpty)
                Text(firm!.email, style: const TextStyle(fontSize: 11)),
              if (firm?.gst != null && firm!.gst.isNotEmpty)
                Text('GSTIN: ${firm!.gst}', style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
        SizedBox(
          width: 90,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('INVOICE NO', style: Theme.of(context).textTheme.labelMedium),
              Text(sale.invoiceNumber, style: const TextStyle(fontSize: 12)),
              const SizedBox(height: 4),
              Text('DATE', style: Theme.of(context).textTheme.labelMedium),
              Text(formatDate(sale.saleDate), style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}

class _BillTo extends StatelessWidget {
  final Sale sale;
  const _BillTo({required this.sale});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Details Of Receiver (Bill To)', style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: 4),
        Text(sale.customerName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
        if (sale.customerAddress != null && sale.customerAddress!.isNotEmpty)
          Text(sale.customerAddress!, style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
      ],
    );
  }
}

class _ItemsTable extends StatelessWidget {
  final List<SaleItem> items;
  const _ItemsTable({required this.items});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 16,
        headingRowHeight: 32,
        dataRowMinHeight: 36,
        dataRowMaxHeight: 48,
        columns: const [
          DataColumn(label: Text('DESC', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('QTY', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('HSN', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('GS WT', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('NT WT', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('RATE', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('MKG', style: TextStyle(fontSize: 11))),
          DataColumn(label: Text('AMOUNT', style: TextStyle(fontSize: 11))),
        ],
        rows: [
          for (final item in items)
            DataRow(
              cells: [
                DataCell(Text(item.name, style: const TextStyle(fontSize: 12))),
                DataCell(Text(item.quantity.toStringAsFixed(0), style: const TextStyle(fontSize: 12))),
                DataCell(Text(item.hsnCode, style: const TextStyle(fontSize: 12))),
                DataCell(Text(item.grossWeight.toStringAsFixed(2), style: const TextStyle(fontSize: 12))),
                DataCell(Text(item.netWeight.toStringAsFixed(2), style: const TextStyle(fontSize: 12))),
                DataCell(Text(formatInr(item.rate, decimals: false), style: const TextStyle(fontSize: 12))),
                DataCell(Text(formatInr(item.makingCharge, decimals: false), style: const TextStyle(fontSize: 12))),
                DataCell(Text(formatInr(item.amount * item.quantity, decimals: false), style: const TextStyle(fontSize: 12))),
              ],
            ),
        ],
      ),
    );
  }
}

class _PaymentBlock extends StatelessWidget {
  final InvoiceScreen sale;
  const _PaymentBlock({required this.sale});

  @override
  Widget build(BuildContext context) {
    final rows = <(String, double)>[
      ('CASH RECEIVED', sale._cashReceived),
      ('CHEQUE RECEIVED', sale._chequeReceived),
      ('CARD RECEIVED', sale._cardReceived),
      ('ONLINE PAYMENT', sale._onlineReceived),
    ].where((r) => r.$2 > 0).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final r in rows)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(r.$1, style: const TextStyle(fontSize: 12)),
                Text(formatInr(r.$2), style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        if (rows.isEmpty)
          const Text('No payment received', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
      ],
    );
  }
}

class _TotalsBlock extends StatelessWidget {
  final Sale sale;
  final double netReceivable;
  const _TotalsBlock({required this.sale, required this.netReceivable});

  @override
  Widget build(BuildContext context) {
    Widget row(String label, String value, {bool red = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 12)),
              Text(
                value,
                style: TextStyle(fontSize: 12, color: red ? AppColors.error : null, fontWeight: red ? FontWeight.bold : null),
              ),
            ],
          ),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        row('AMOUNT', formatInr(sale.subtotal)),
        row('TAXABLE AMT', formatInr(sale.taxableAmount)),
        row('CGST (${sale.gst.cgstRate}%)', formatInr(sale.gst.cgstAmount)),
        row('SGST (${sale.gst.sgstRate}%)', formatInr(sale.gst.sgstAmount)),
        if (sale.gst.igstRate > 0) row('IGST (${sale.gst.igstRate}%)', formatInr(sale.gst.igstAmount)),
        row('TOTAL AMOUNT', formatInr(sale.totalAmount)),
        row('NET RECEIVABLE AMT', formatInr(netReceivable)),
        row(
          'AMT BALANCE',
          sale.udharAmount > 0 ? '${formatInr(sale.udharAmount)} DR' : formatInr(0),
          red: sale.udharAmount > 0,
        ),
      ],
    );
  }
}
