const _ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const _tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

String _twoDigits(int n) {
  if (n < 20) return _ones[n];
  return '${_tens[n ~/ 10]}${n % 10 != 0 ? ' ${_ones[n % 10]}' : ''}';
}

String _threeDigits(int n) {
  final hundred = n ~/ 100;
  final rest = n % 100;
  if (hundred == 0) return _twoDigits(rest);
  return 'rest'.replaceFirst(
    'rest',
    '${_ones[hundred]} Hundred${rest != 0 ? ' ${_twoDigits(rest)}' : ''}',
  );
}

/// Indian numbering system (lakh/crore) currency-in-words, e.g.
/// 77000 -> "Seventy-seven Thousand Only/-".
String amountInWords(num amount) {
  var n = amount.round();
  if (n == 0) return 'Zero Only/-';
  final negative = n < 0;
  n = n.abs();

  final crore = n ~/ 10000000;
  n %= 10000000;
  final lakh = n ~/ 100000;
  n %= 100000;
  final thousand = n ~/ 1000;
  n %= 1000;
  final hundred = n;

  final parts = <String>[];
  if (crore > 0) parts.add('${_threeDigits(crore)} Crore');
  if (lakh > 0) parts.add('${_threeDigits(lakh)} Lakh');
  if (thousand > 0) parts.add('${_threeDigits(thousand)} Thousand');
  if (hundred > 0) parts.add(_threeDigits(hundred));

  final words = parts.join(' ');
  return '${negative ? "Minus " : ""}$words Only/-';
}
