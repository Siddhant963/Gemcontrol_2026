import 'package:flutter/widgets.dart';

/// Per-form helper that decides WHEN a field error is shown, using the form's
/// own pure rules (a function returning `{field: message}` for every invalid
/// field):
///   * blur   -> the error appears as the user leaves the field ([wrap])
///   * submit -> every error appears at once ([validateAll])
///   * edit   -> a field that already shows an error is re-checked on every
///               change, so it clears the moment it is valid ([changed]);
///               nothing is shown for a field the user has not touched.
/// Backend validation stays authoritative: [setServerError] puts a server
/// message on the right field once the caller has decided which one it is.
class LiveValidation {
  final Map<String, String> Function() _rules;
  final VoidCallback _notify;
  final Map<String, String> _shown = {};

  /// [rules] computes the current errors; [notify] rebuilds the form
  /// (normally `() => setState(() {})`).
  LiveValidation(this._rules, this._notify);

  String? errorFor(String field) => _shown[field];

  /// First field (in [order]) currently showing an error, to scroll to.
  String? firstErrorField(List<String> order) {
    for (final f in order) {
      if (_shown.containsKey(f)) return f;
    }
    return null;
  }

  /// The user left [field]: validate just that field.
  void blur(String field) {
    final message = _rules()[field];
    final had = _shown[field];
    if (message == null) {
      _shown.remove(field);
    } else {
      _shown[field] = message;
    }
    if (message != had) _notify();
  }

  /// A value changed: re-check every field that currently shows an error
  /// (cross-field rules such as "less weight < gross weight" stay correct).
  void changed() {
    if (_shown.isEmpty) return;
    final fresh = _rules();
    var dirty = false;
    for (final field in _shown.keys.toList()) {
      final message = fresh[field];
      if (message == null) {
        _shown.remove(field);
        dirty = true;
      } else if (message != _shown[field]) {
        _shown[field] = message;
        dirty = true;
      }
    }
    if (dirty) _notify();
  }

  /// Submit: show every error at once. Returns true when the form is valid.
  bool validateAll() {
    final all = _rules();
    _shown
      ..clear()
      ..addAll(all);
    _notify();
    return all.isEmpty;
  }

  void setServerError(String field, String message) {
    _shown[field] = message;
    _notify();
  }

  /// Wraps a field so losing focus validates it. Not focusable itself and
  /// skipped by traversal, so it adds no extra tab stop.
  Widget wrap(String field, Widget child) => Focus(
    canRequestFocus: false,
    skipTraversal: true,
    onFocusChange: (hasFocus) {
      if (!hasFocus) blur(field);
    },
    child: child,
  );
}
