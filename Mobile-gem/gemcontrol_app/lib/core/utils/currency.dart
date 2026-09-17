import 'package:intl/intl.dart';

final _inrFormat = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
);

final _inrFormatNoDecimals = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);

/// Indian lakh/crore grouped currency, e.g. ₹12,34,567.89.
String formatInr(num value, {bool decimals = true}) =>
    decimals ? _inrFormat.format(value) : _inrFormatNoDecimals.format(value);

/// Like [formatInr] with decimals off, but never collapses a genuinely
/// nonzero amount (e.g. ₹0.40) down to a misleading "₹0" — falls back to
/// showing paise only for sub-rupee values.
String formatInrRounded(num value) =>
    (value != 0 && value.abs() < 1) ? formatInr(value, decimals: true) : formatInr(value, decimals: false);

/// Compact Indian currency for tight spaces (single-row stat tiles), e.g.
/// ₹12.3L, ₹4Cr, ₹850. Falls back to [formatInr] below ₹1,000.
String formatInrCompact(num value) {
  final v = value.toDouble();
  final sign = v < 0 ? '-' : '';
  final abs = v.abs();
  if (abs >= 10000000) {
    return '$sign₹${(abs / 10000000).toStringAsFixed(abs >= 100000000 ? 0 : 1)}Cr';
  }
  if (abs >= 100000) {
    return '$sign₹${(abs / 100000).toStringAsFixed(abs >= 1000000 ? 0 : 1)}L';
  }
  if (abs >= 1000) {
    return '$sign₹${(abs / 1000).toStringAsFixed(abs >= 10000 ? 0 : 1)}k';
  }
  return formatInrRounded(value);
}

final _dateFormat = DateFormat('dd MMM yyyy');
final _dateTimeFormat = DateFormat('dd MMM yyyy, hh:mm a');

String formatDate(DateTime? date) =>
    date == null ? '-' : _dateFormat.format(date);

String formatDateTime(DateTime? date) =>
    date == null ? '-' : _dateTimeFormat.format(date);
