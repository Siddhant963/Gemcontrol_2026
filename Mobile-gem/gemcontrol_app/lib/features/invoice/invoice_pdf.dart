import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../../core/api/api_client.dart';
import '../../core/models/firm.dart';
import '../../core/models/sale.dart';
import '../../core/utils/currency.dart';
import '../../core/utils/number_to_words.dart';

/// Renders the same GST invoice layout shown on [InvoiceScreen] as a PDF, for
/// printing or sharing/saving.
Future<Uint8List> buildInvoicePdf(Sale sale, Firm? firm) async {
  final doc = pw.Document();
  final logoImage = await _fetchImage(firm?.logo);
  final signatureImage = await _fetchImage(firm?.ownerSignature);
  final netReceivable = sale.totalAmount - sale.udharAmount;

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(28),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          _header(firm, sale, logoImage),
          pw.Divider(color: PdfColors.grey400),
          pw.Center(
            child: pw.Text(
              'GST INVOICE',
              style: pw.TextStyle(fontWeight: pw.FontWeight.bold, letterSpacing: 1, fontSize: 12),
            ),
          ),
          pw.SizedBox(height: 12),
          _billTo(sale),
          pw.SizedBox(height: 16),
          pw.Text('Items', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 6),
          _itemsTable(sale.items),
          pw.Divider(color: PdfColors.grey400),
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(child: _paymentBlock(sale)),
              pw.SizedBox(width: 16),
              pw.Expanded(child: _totalsBlock(sale, netReceivable)),
            ],
          ),
          pw.Divider(color: PdfColors.grey400),
          pw.Text(
            'PAYABLE AMOUNT: ${amountInWords(sale.totalAmount)}',
            style: pw.TextStyle(fontStyle: pw.FontStyle.italic, fontSize: 9),
          ),
          pw.SizedBox(height: 40),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Column(
                children: [
                  pw.Container(width: 120, height: 0.5, color: PdfColors.grey600),
                  pw.SizedBox(height: 2),
                  pw.Text('Customer Signatory', style: const pw.TextStyle(fontSize: 9)),
                ],
              ),
              pw.Column(
                children: [
                  if (signatureImage != null)
                    pw.Container(
                      width: 120,
                      height: 40,
                      alignment: pw.Alignment.bottomCenter,
                      child: pw.Image(signatureImage, fit: pw.BoxFit.contain),
                    )
                  else
                    pw.SizedBox(width: 120, height: 40),
                  pw.Container(width: 120, height: 0.5, color: PdfColors.grey600),
                  pw.SizedBox(height: 2),
                  pw.Text('Authorized Signatory', style: const pw.TextStyle(fontSize: 9)),
                ],
              ),
            ],
          ),
        ],
      ),
    ),
  );

  return doc.save();
}

Future<pw.MemoryImage?> _fetchImage(String? path) async {
  if (path == null || path.isEmpty) return null;
  try {
    final response = await Dio().get<List<int>>(
      resolveUploadUrl(path),
      options: Options(responseType: ResponseType.bytes),
    );
    final data = response.data;
    if (data == null) return null;
    return pw.MemoryImage(Uint8List.fromList(data));
  } catch (_) {
    return null;
  }
}

pw.Widget _header(Firm? firm, Sale sale, pw.MemoryImage? logoImage) {
  return pw.Row(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Container(
        width: 48,
        height: 48,
        alignment: pw.Alignment.center,
        child: logoImage != null ? pw.Image(logoImage, fit: pw.BoxFit.contain) : null,
      ),
      pw.Expanded(
        child: pw.Column(
          children: [
            pw.Text(
              firm?.name ?? 'Firm',
              textAlign: pw.TextAlign.center,
              style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
            ),
            if (firm?.registrationNo.isNotEmpty ?? false)
              pw.Text('Reg. No: ${firm!.registrationNo}', style: const pw.TextStyle(fontSize: 9)),
            if (firm?.email.isNotEmpty ?? false)
              pw.Text(firm!.email, style: const pw.TextStyle(fontSize: 9)),
            if (firm?.gst.isNotEmpty ?? false)
              pw.Text('GSTIN: ${firm!.gst}', style: const pw.TextStyle(fontSize: 9)),
          ],
        ),
      ),
      pw.SizedBox(
        width: 90,
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Text('INVOICE NO', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
            pw.Text(sale.invoiceNumber, style: const pw.TextStyle(fontSize: 10)),
            pw.SizedBox(height: 4),
            pw.Text('DATE', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
            pw.Text(formatDate(sale.saleDate), style: const pw.TextStyle(fontSize: 10)),
          ],
        ),
      ),
    ],
  );
}

pw.Widget _billTo(Sale sale) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('Details Of Receiver (Bill To)', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
      pw.SizedBox(height: 4),
      pw.Text(sale.customerName ?? '-', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
      if (sale.customerAddress != null && sale.customerAddress!.isNotEmpty)
        pw.Text(sale.customerAddress!, style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
    ],
  );
}

pw.Widget _itemsTable(List<SaleItem> items) {
  const headers = ['DESC', 'QTY', 'HSN', 'GS WT', 'NT WT', 'RATE', 'MKG', 'AMOUNT'];
  return pw.Table(
    border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
    columnWidths: const {
      0: pw.FlexColumnWidth(2.4),
      1: pw.FlexColumnWidth(0.8),
      2: pw.FlexColumnWidth(1),
      3: pw.FlexColumnWidth(1),
      4: pw.FlexColumnWidth(1),
      5: pw.FlexColumnWidth(1.2),
      6: pw.FlexColumnWidth(1.2),
      7: pw.FlexColumnWidth(1.4),
    },
    children: [
      pw.TableRow(
        decoration: const pw.BoxDecoration(color: PdfColors.grey200),
        children: [
          for (final h in headers)
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: pw.Text(h, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
            ),
        ],
      ),
      for (final item in items)
        pw.TableRow(
          children: [
            _cell(item.name),
            _cell(item.quantity.toStringAsFixed(0)),
            _cell(item.hsnCode),
            _cell(item.grossWeight.toStringAsFixed(2)),
            _cell(item.netWeight.toStringAsFixed(2)),
            _cell(formatInr(item.rate, decimals: false)),
            _cell(formatInr(item.makingCharge, decimals: false)),
            _cell(formatInr(item.amount * item.quantity, decimals: false)),
          ],
        ),
    ],
  );
}

pw.Widget _cell(String text) => pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
      child: pw.Text(text, style: const pw.TextStyle(fontSize: 8)),
    );

double _sumByGroup(Sale sale, Set<String> methods) =>
    sale.payments.where((p) => methods.contains(p.method)).fold(0.0, (sum, p) => sum + p.amount);

pw.Widget _paymentBlock(Sale sale) {
  final rows = <(String, double)>[
    ('CASH RECEIVED', _sumByGroup(sale, {'cash'})),
    ('CHEQUE RECEIVED', _sumByGroup(sale, {'cheque'})),
    ('CARD RECEIVED', _sumByGroup(sale, {'card'})),
    ('ONLINE PAYMENT', _sumByGroup(sale, {'online', 'bankTransfer', 'Upi', 'other'})),
  ].where((r) => r.$2 > 0).toList();

  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      for (final r in rows)
        pw.Padding(
          padding: const pw.EdgeInsets.symmetric(vertical: 2),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(r.$1, style: const pw.TextStyle(fontSize: 9)),
              pw.Text(formatInr(r.$2), style: const pw.TextStyle(fontSize: 9)),
            ],
          ),
        ),
      if (rows.isEmpty) pw.Text('No payment received', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
    ],
  );
}

pw.Widget _totalsBlock(Sale sale, double netReceivable) {
  pw.Widget row(String label, String value, {bool red = false}) => pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 2),
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(label, style: const pw.TextStyle(fontSize: 9)),
            pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: 9,
                color: red ? PdfColors.red : PdfColors.black,
                fontWeight: red ? pw.FontWeight.bold : pw.FontWeight.normal,
              ),
            ),
          ],
        ),
      );

  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
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
