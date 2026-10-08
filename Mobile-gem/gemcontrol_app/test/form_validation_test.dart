import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gemcontrol_app/features/customers/customers_screen.dart';
import 'package:gemcontrol_app/features/stock/karat_options.dart';
import 'package:gemcontrol_app/features/users/users_screen.dart';
import 'package:gemcontrol_app/shared/forms/validators.dart';

/// google_fonts tries to download fonts in tests and throws asynchronously;
/// that is unrelated to what is under test, so it is swallowed here.
void guardFonts(Future<void> Function() body) {
  runZonedGuarded(() => body(), (e, s) {
    if (!e.toString().contains('google_fonts')) {
      // ignore: only font download noise is expected here
    }
  });
}

Future<void> settle(WidgetTester t) async {
  for (var i = 0; i < 5; i++) {
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 20)));
    await t.pump(const Duration(milliseconds: 100));
  }
}

Future<void> openSheet(WidgetTester t, Widget sheet) async {
  await t.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        home: Scaffold(body: Builder(builder: (c) => Center(child: ElevatedButton(
          onPressed: () => showModalBottomSheet(context: c, isScrollControlled: true, builder: (_) => sheet),
          child: const Text('open'),
        )))),
      ),
    ),
  );
  await t.tap(find.text('open'));
  await settle(t);
}

void main() {
  group('rules', () {
    test('nameRule', () {
      expect(nameRule(''), isNotNull);
      expect(nameRule('A'), isNotNull);
      expect(nameRule('1234'), isNotNull);
      expect(nameRule('Ravi'), isNull);
      expect(nameRule('x' * (kNameMax + 1)), isNotNull);
    });

    test('phoneRule needs exactly 10 digits', () {
      expect(phoneRule(''), isNotNull);
      expect(phoneRule('12345'), isNotNull);
      expect(phoneRule('98765432101'), isNotNull);
      expect(phoneRule('9876543210'), isNull);
    });

    test('emailRule / passwordRule', () {
      expect(emailRule('abc'), isNotNull);
      expect(emailRule('a@b.co'), isNull);
      expect(passwordRule('12345'), isNotNull);
      expect(passwordRule('123456'), isNull);
    });

    test('number rules', () {
      expect(positiveNumberRule('', 'Weight'), isNotNull);
      expect(positiveNumberRule('0', 'Weight'), isNotNull);
      expect(positiveNumberRule('2.5', 'Weight'), isNull);
      expect(positiveNumberRule('200', 'Weight', max: 100), isNotNull);
      expect(nonNegativeNumberRule('', 'X'), isNull);
      expect(nonNegativeNumberRule('-1', 'X'), isNotNull);
    });

    test('errorsOf drops passing checks', () {
      expect(errorsOf({'a': null, 'b': 'bad'}), {'b': 'bad'});
    });
  });

  group('formatters', () {
    TextEditingValue run(List<TextInputFormatter> f, String text) {
      var v = TextEditingValue.empty;
      for (final fmt in f) {
        v = fmt.formatEditUpdate(TextEditingValue.empty, TextEditingValue(text: text));
      }
      return v;
    }

    test('phone keeps only 10 digits and strips +91 / 0', () {
      expect(run(phoneFormatters, 'ab98765xx43210999').text, '9876543210');
      expect(run(phoneFormatters, '+91 98765 43210').text, '9876543210');
      expect(run(phoneFormatters, '098765 43210').text, '9876543210');
    });

    test('decimal allows one dot and limited decimals', () {
      final f = decimalFormatters(decimals: 2, maxLength: 12).first;
      final ok = f.formatEditUpdate(TextEditingValue.empty, const TextEditingValue(text: '12.34'));
      expect(ok.text, '12.34');
      final bad = f.formatEditUpdate(const TextEditingValue(text: '12.34'), const TextEditingValue(text: '12.345'));
      expect(bad.text, '12.34'); // 3rd decimal ignored, box not wiped
      final letters = f.formatEditUpdate(TextEditingValue.empty, const TextEditingValue(text: '1a'));
      expect(letters.text, '');
    });
  });

  group('normalizeKarat', () {
    test('maps loose input to the exact option', () {
      expect(normalizeKarat('gold', '22'), '22K');
      expect(normalizeKarat('gold', '22k'), '22K');
      expect(normalizeKarat('gold', '22 kt'), '22K');
      expect(normalizeKarat('gold', '21'), isNull);
      expect(normalizeKarat('diamond', '1 carat'), '1 Carat');
      expect(normalizeKarat('silver', '22'), isNull);
    });

    test('only gold and diamond have options', () {
      expect(karatOptionsFor('gold'), kGoldKarats);
      expect(karatOptionsFor('diamond'), kDiamondCarats);
      expect(karatOptionsFor('silver'), isEmpty);
    });
  });

  group('sheets show errors on the form itself', () {
    testWidgets('customer: empty save shows every error inline, nothing sent', (t) async {
      guardFonts(() async {});
      await openSheet(t, const AddCustomerSheet());
      await t.tap(find.text('Save Customer'));
      await settle(t);
      expect(find.text('Name is required'), findsOneWidget);
      expect(find.textContaining('Contact'), findsWidgets);
      expect(find.textContaining('mail'), findsWidgets);
      await t.pump(const Duration(seconds: 10)); // let the toast time out
    });

    testWidgets('customer: phone box takes digits only and max 10', (t) async {
      await openSheet(t, const AddCustomerSheet());
      final phone = find.widgetWithText(TextField, 'Contact number');
      await t.enterText(phone, '98ab76543210999');
      await settle(t);
      expect(t.widget<TextField>(phone).controller!.text, '9876543210');
    });

    testWidgets('customer: name box is capped', (t) async {
      await openSheet(t, const AddCustomerSheet());
      final name = find.widgetWithText(TextField, 'Name');
      await t.enterText(name, 'a' * 200);
      await settle(t);
      expect(t.widget<TextField>(name).controller!.text.length, kNameMax);
    });

    testWidgets('user sheet: short password and bad phone are flagged', (t) async {
      await openSheet(t, const AddUserSheet());
      await t.enterText(find.widgetWithText(TextField, 'Name'), 'Ravi Kumar');
      await t.enterText(find.widgetWithText(TextField, 'Email'), 'ravi@x.com');
      await t.enterText(find.widgetWithText(TextField, 'Contact'), '12345');
      await t.enterText(find.widgetWithText(TextField, 'Password'), '123');
      await t.tap(find.text('Create User'));
      await settle(t);
      expect(find.textContaining('10 digits'), findsWidgets);
      expect(find.textContaining('at least 6'), findsWidgets);
      await t.pump(const Duration(seconds: 10));
    });
  });
}
