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

final _dateFormat = DateFormat('dd MMM yyyy');
final _dateTimeFormat = DateFormat('dd MMM yyyy, hh:mm a');

String formatDate(DateTime? date) =>
    date == null ? '-' : _dateFormat.format(date);

String formatDateTime(DateTime? date) =>
    date == null ? '-' : _dateTimeFormat.format(date);
