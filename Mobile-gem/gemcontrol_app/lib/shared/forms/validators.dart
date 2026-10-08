import 'package:flutter/services.dart';

/// Shared field rules and input limits for every data-entry form, so a bad
/// value is stopped (or explained) right in the box instead of failing later
/// at the server. The rules mirror the backend (Controllers/adminController.js:
/// isValidName, EMAIL_REGEX, PHONE_REGEX, MIN_PASSWORD_LENGTH) -- the backend
/// stays the authority, this just gives the answer instantly.

// ---- length limits (the backend enforces the same numbers) ----
const kNameMax = 60; // person / firm / item / category names
const kEmailMax = 100;
const kAddressMax = 200;
const kShortTextMax = 60; // city, bank, branch, item type, location ...
const kDescriptionMax = 300;
const kPasswordMin = 6;
const kPasswordMax = 64;
const kPhoneLength = 10;

final _emailRe = RegExp(r'^\S+@\S+\.\S+$'); // same as the backend
final _letterRe = RegExp(r'[A-Za-z]');
final _phoneRe = RegExp(r'^\d{10}$');

String? requiredText(String value, String label) =>
    value.trim().isEmpty ? '$label is required' : null;

/// A name must have at least one letter and at least 2 characters (digits are
/// allowed in business names, e.g. "22K Gold Ring").
String? nameRule(String value, {String label = 'Name', int max = kNameMax, bool required = true}) {
  final v = value.trim();
  if (v.isEmpty) return required ? '$label is required' : null;
  if (v.length < 2) return '$label must be at least 2 characters';
  if (!_letterRe.hasMatch(v)) return '$label must contain letters, not just numbers';
  if (v.length > max) return '$label can be at most $max characters';
  return null;
}

String? phoneRule(String value, {String label = 'Contact number', bool required = true}) {
  final v = value.trim();
  if (v.isEmpty) return required ? '$label is required' : null;
  if (!_phoneRe.hasMatch(v)) return '$label must be exactly $kPhoneLength digits';
  return null;
}

String? emailRule(String value, {String label = 'Email', bool required = true}) {
  final v = value.trim();
  if (v.isEmpty) return required ? '$label is required' : null;
  if (v.length > kEmailMax) return '$label can be at most $kEmailMax characters';
  if (!_emailRe.hasMatch(v)) return 'Enter a valid email address';
  return null;
}

String? passwordRule(String value, {String label = 'Password'}) {
  if (value.isEmpty) return '$label is required';
  if (value.length < kPasswordMin) return '$label must be at least $kPasswordMin characters';
  if (value.length > kPasswordMax) return '$label can be at most $kPasswordMax characters';
  return null;
}

String? maxLengthRule(String value, String label, int max) =>
    value.trim().length > max ? '$label can be at most $max characters' : null;

/// Required text with a maximum length (address, city, bank name ...).
String? textRule(String value, String label, {int max = kShortTextMax, bool required = true}) {
  final v = value.trim();
  if (v.isEmpty) return required ? '$label is required' : null;
  if (v.length > max) return '$label can be at most $max characters';
  return null;
}

/// A number that must be greater than zero (weight, price, quantity, amount).
String? positiveNumberRule(String value, String label, {double? max}) {
  final v = value.trim();
  if (v.isEmpty) return '$label is required';
  final n = double.tryParse(v);
  if (n == null) return 'Enter a valid number for $label';
  if (n <= 0) return '$label must be greater than 0';
  if (max != null && n > max) return '$label cannot be more than ${_trim(max)}';
  return null;
}

/// A number that may be zero but not negative (charges, wastage, tax %).
String? nonNegativeNumberRule(String value, String label, {double? max, bool required = false}) {
  final v = value.trim();
  if (v.isEmpty) return required ? '$label is required' : null;
  final n = double.tryParse(v);
  if (n == null) return 'Enter a valid number for $label';
  if (n < 0) return '$label cannot be negative';
  if (max != null && n > max) return '$label cannot be more than ${_trim(max)}';
  return null;
}

/// Drops the passing checks: {'name': null, 'phone': 'too short'} -> {'phone': 'too short'}.
Map<String, String> errorsOf(Map<String, String?> checks) => {
  for (final e in checks.entries)
    if (e.value != null) e.key: e.value!,
};

String _trim(double n) => n == n.roundToDouble() ? n.toStringAsFixed(0) : n.toString();

// ---- input formatters: stop impossible input as it is typed ----

/// Indian mobile number box: digits only, at most 10. A pasted "+91 98765
/// 43210" or "098765 43210" is cleaned to the 10 digit number instead of being
/// silently chopped to the wrong digits.
class PhoneInputFormatter extends TextInputFormatter {
  const PhoneInputFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > kPhoneLength) {
      if (digits.length == 12 && digits.startsWith('91')) {
        digits = digits.substring(2);
      } else if (digits.length == 11 && digits.startsWith('0')) {
        digits = digits.substring(1);
      }
    }
    if (digits.length > kPhoneLength) digits = digits.substring(0, kPhoneLength);
    return TextEditingValue(
      text: digits,
      selection: TextSelection.collapsed(offset: digits.length),
    );
  }
}

const phoneFormatters = <TextInputFormatter>[PhoneInputFormatter()];

List<TextInputFormatter> lengthLimit(int max) => [LengthLimitingTextInputFormatter(max)];

/// Accepts text only while it still looks like a decimal with at most
/// [decimals] places; anything else keeps the previous value (so typing a 4th
/// decimal is ignored instead of wiping the box).
class _DecimalInputFormatter extends TextInputFormatter {
  final RegExp _re;
  _DecimalInputFormatter(int decimals) : _re = RegExp(r'^\d*\.?\d{0,' + decimals.toString() + r'}$');

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) =>
      _re.hasMatch(newValue.text) ? newValue : oldValue;
}

/// Positive decimal like 12.345: digits and one dot, limited decimals/length.
List<TextInputFormatter> decimalFormatters({int decimals = 3, int maxLength = 12}) => [
  _DecimalInputFormatter(decimals),
  LengthLimitingTextInputFormatter(maxLength),
];

/// Whole number digits only (pincode, account number, quantity).
List<TextInputFormatter> digitsFormatters(int maxLength) => [
  FilteringTextInputFormatter.digitsOnly,
  LengthLimitingTextInputFormatter(maxLength),
];
