// Unit tests for the pure, StoreKit-free decision logic in
// AppleIapController -- specifically canStartApplePurchase(), which is
// what buy() checks before ever touching a real purchase sheet. No
// platform channels, no InAppPurchase.instance, no mocking framework:
// AppleIapState is plain data, canStartApplePurchase is a pure function.
//
// What is deliberately NOT covered here (documented, not silently
// skipped): the actual StoreKit purchaseStream/buyNonConsumable/
// completePurchase calls, and any live Apple Sandbox/Production behavior
// -- none of that was exercised, and this file makes no claim that it was.
import 'package:flutter_test/flutter_test.dart';
import 'package:gemcontrol_app/features/subscription/apple_iap_controller.dart';

void main() {
  group('canStartApplePurchase', () {
    test('6. token still loading -> cannot start', () {
      const state = AppleIapState(appAccountTokenLoading: true, appAccountToken: null);
      expect(canStartApplePurchase(state), false);
    });

    test('7. token load failed (not loading, still null) -> cannot start', () {
      const state = AppleIapState(
        appAccountTokenLoading: false,
        appAccountTokenFailed: true,
        appAccountToken: null,
      );
      expect(canStartApplePurchase(state), false);
    });

    test('token loaded successfully -> can start', () {
      const state = AppleIapState(appAccountTokenLoading: false, appAccountToken: 'firm-token');
      expect(canStartApplePurchase(state), true);
    });

    test('defensive: not loading, no failure flag, but token still somehow null -> cannot start', () {
      const state = AppleIapState(
        appAccountTokenLoading: false,
        appAccountTokenFailed: false,
        appAccountToken: null,
      );
      expect(canStartApplePurchase(state), false);
    });

    test('default AppleIapState() (fresh controller, before first load) -> cannot start', () {
      const state = AppleIapState();
      expect(state.appAccountTokenLoading, true); // default is loading=true
      expect(canStartApplePurchase(state), false);
    });
  });
}
