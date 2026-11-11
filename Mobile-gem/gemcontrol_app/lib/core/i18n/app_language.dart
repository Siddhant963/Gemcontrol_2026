import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'translations_hi.dart';

const _languageKey = 'gc_language';

/// Languages the app can show. English is the source language: every string in
/// the code is English and is looked up in a dictionary when another language
/// is active, so a missing translation simply stays in English.
enum AppLanguage {
  en('en', 'English', 'EN'),
  hi('hi', 'हिन्दी', 'हिं');

  const AppLanguage(this.code, this.label, this.short);
  final String code;
  final String label;
  final String short;

  static AppLanguage fromCode(String? code) =>
      AppLanguage.values.firstWhere((l) => l.code == code, orElse: () => AppLanguage.en);
}

/// Current language, readable anywhere without a BuildContext (used by [tr]).
AppLanguage _current = AppLanguage.en;
AppLanguage get currentLanguage => _current;

/// Tests share this global between cases; put it back to English.
@visibleForTesting
void resetLanguageForTest() => _current = AppLanguage.en;

final RegExp _templateSlot = RegExp(r'\{\}');

class _Template {
  _Template(this.pattern, this.output);
  final RegExp pattern;
  final String output;
}

/// Dictionary entries containing `{}` are templates for strings with values
/// interpolated into them ("Welcome back, {}"); each `{}` captures one value
/// that is carried into the same slot of the translation.
final List<_Template> _hiTemplates = [
  for (final e in hiTranslations.entries)
    if (e.key.contains('{}'))
      _Template(
        RegExp('^${e.key.split('{}').map(RegExp.escape).join('(.+?)')}\$', dotAll: true),
        e.value,
      ),
];

final Map<String, String> _hiLower = {
  for (final e in hiTranslations.entries) e.key.toLowerCase(): e.value,
};

String _norm(String s) => s.replaceAll(RegExp(r'\s+'), ' ').trim();

String? _lookup(String text) {
  final hit = hiTranslations[text] ?? _hiLower[text.toLowerCase()];
  if (hit != null) return hit;
  // "Name:" / "Name..." share the entry for "Name".
  final m = RegExp(r'^(.*?)\s*([:.!…]+)$').firstMatch(text);
  if (m != null && m.group(1)!.isNotEmpty) {
    final base = hiTranslations[m.group(1)!] ?? _hiLower[m.group(1)!.toLowerCase()];
    if (base != null) return base + (m.group(2) == ':' ? ':' : m.group(2)!);
  }
  for (final t in _hiTemplates) {
    final match = t.pattern.firstMatch(text);
    if (match == null) continue;
    var i = 1;
    return t.output.replaceAllMapped(_templateSlot, (_) {
      final v = i <= match.groupCount ? match.group(i) ?? '' : '';
      i++;
      // Captured pieces like "Gold" or "Cash" are translated too.
      return _lookupSimple(v) ?? v;
    });
  }
  return null;
}

String? _lookupSimple(String v) => hiTranslations[v] ?? _hiLower[v.toLowerCase()];

/// Translate [text] into the active language. Returns [text] unchanged for
/// English, empty strings, or phrases with no translation.
String tr(String? text) {
  if (text == null || text.isEmpty || _current == AppLanguage.en) return text ?? '';
  final core = _norm(text);
  if (core.isEmpty) return text;
  final out = _lookup(core);
  if (out == null) return text;
  final lead = text.substring(0, text.length - text.trimLeft().length);
  final trail = text.substring(text.trimRight().length);
  return '$lead$out$trail';
}

/// Rebuilds every widget currently mounted (keeping their state) so strings
/// resolved with [tr] pick up a language change.
void _rebuildEverything() {
  final root = WidgetsBinding.instance.rootElement;
  if (root == null) return;
  void visit(Element el) {
    el.markNeedsBuild();
    el.visitChildren(visit);
  }

  root.visitChildren(visit);
}

class LanguageController extends StateNotifier<AppLanguage> {
  LanguageController() : super(AppLanguage.en) {
    _init();
  }

  Future<void> _init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString(_languageKey);
      if (stored != null) await _apply(AppLanguage.fromCode(stored), persist: false);
    } catch (_) {
      // Non-critical — stay on English.
    }
  }

  Future<void> _apply(AppLanguage language, {required bool persist}) async {
    _current = language;
    try {
      await initializeDateFormatting(language.code);
      Intl.defaultLocale = language.code;
    } catch (_) {
      // Date names stay in English if locale data can't load.
    }
    state = language;
    // Mark every mounted widget dirty so strings resolved with tr() refresh
    // (this also schedules the frame that paints them).
    _rebuildEverything();
    if (persist) {
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_languageKey, language.code);
      } catch (_) {
        // Best-effort persistence; the in-memory state already updated.
      }
    }
  }

  Future<void> setLanguage(AppLanguage language) async {
    if (language == state) return;
    await _apply(language, persist: true);
  }
}

final languageControllerProvider =
    StateNotifierProvider<LanguageController, AppLanguage>((ref) => LanguageController());
