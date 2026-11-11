import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gemcontrol_app/core/i18n/app_language.dart';
import 'package:gemcontrol_app/core/i18n/tr_text.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    resetLanguageForTest();
  });

  test('English is the default and returns text unchanged', () {
    expect(currentLanguage, AppLanguage.en);
    expect(tr('Dashboard'), 'Dashboard');
    expect(tr(null), '');
  });

  test('Hindi lookup: exact, case-insensitive, trailing colon, templates', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    await container.read(languageControllerProvider.notifier).setLanguage(AppLanguage.hi);

    expect(tr('Dashboard'), 'डैशबोर्ड');
    expect(tr('INVOICE NO'), 'इनवॉइस नंबर');
    expect(tr('Total Amount:'), 'कुल राशि:');
    expect(tr('Name is required'), 'नाम आवश्यक है');
    expect(tr('Trial · 5 day(s) left'), 'ट्रायल · 5 दिन बाकी');
    expect(tr('Overpaid by ₹1,200'), '₹1,200 अधिक चुकाया');
    expect(tr('  Settings '), '  सेटिंग्स ');
    // No entry -> left in English rather than breaking the screen.
    expect(tr('Some brand new phrase'), 'Some brand new phrase');
    // Customer-entered data that isn't a dictionary phrase is untouched.
    expect(tr('Amit Soni'), 'Amit Soni');
  });

  testWidgets('Text widget switches language', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: Scaffold(body: Text('Settings'))),
      ),
    );
    expect(find.text('Settings'), findsOneWidget);

    await container.read(languageControllerProvider.notifier).setLanguage(AppLanguage.hi);
    await tester.pumpAndSettle();
    expect(find.text('सेटिंग्स'), findsOneWidget);

    await container.read(languageControllerProvider.notifier).setLanguage(AppLanguage.en);
    await tester.pumpAndSettle();
    expect(find.text('Settings'), findsOneWidget);
  });
}
