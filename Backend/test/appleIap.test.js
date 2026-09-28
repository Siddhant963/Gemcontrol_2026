// Unit tests for the PURE decision logic in Utils/appleIap.js -- the parts
// that don't need a live MongoDB or a real Apple Sandbox/Production
// environment to exercise. No DB connection, no network calls, no mocking
// framework: everything here is plain data in, plain verdict out.
//
// Run with: node --test test/appleIap.test.js
// (Node's built-in test runner -- no new dependency needed; this repo is
// on Node 24, which has had node:test since Node 18.)
//
// Coverage against the fail-closed appAccountToken fix's requested test
// matrix:
//   1. token + matching token -> PASS ................. covered below
//   2. token + mismatching token -> REJECT ............. covered below
//   3. missing Apple token + firm token -> REJECT ...... covered below
//   4. Apple token + missing firm token -> REJECT ...... covered below
//   5. both missing -> REJECT ........................... covered below
//   6. buy() cannot execute before token loaded ......... Flutter-side;
//      see Mobile-gem/.../test/apple_iap_controller_test.dart
//   7. token retrieval failure cannot start purchase .... ditto
//   8. Sandbox behavior controlled by APPLE_IAP_ALLOW_SANDBOX
//      .................................................. covered below
//      (tests B / B(alt) / B(staging))
//   9. existing originalTransactionId cross-firm protection still works
//      .................................................. covered below
//      (test D)
//  10. notification with no resolvable firm does not mutate anything
//      .................................................. NOT unit-tested
//      here (needs a real/mocked DB + Mongoose model -- verified by
//      manual code trace of appleAppStoreNotifications's
//      `if (!targetFirm) { return ...200, no mutation... }` guard, which
//      this change did not touch)
//
// What is deliberately NOT covered here (documented, not silently skipped):
//   - Idempotent resubmission by the same firm (needs a real/mocked DB to
//     observe activatePaidSubscription's findOneAndUpdate + populate
//     behavior) -- verified by manual code trace only.
//   - The Mongo duplicate-key -> AppleTransactionOwnershipConflictError
//     path (needs a real unique index + a genuine E11000 from Mongo).
//   - Any live Apple Sandbox/Production signature verification (needs a
//     real device/TestFlight build and real Apple servers).
const test = require("node:test");
const assert = require("node:assert/strict");

function freshAppleIap(env = {}) {
  // appleIap.js reads several env vars ONCE at module-load time
  // (ALLOW_SANDBOX, DEFAULT_ENVIRONMENT, BUNDLE_ID, APP_APPLE_ID) --
  // require.cache is cleared and env vars are set beforehand so each test
  // that needs a specific configuration gets its own fresh module
  // evaluation, rather than fighting Node's module cache.
  const modulePath = require.resolve("../Utils/appleIap.js");
  delete require.cache[modulePath];
  const previous = {};
  for (const key of Object.keys(env)) {
    previous[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  const mod = require(modulePath);
  for (const key of Object.keys(env)) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
  return mod;
}

test("A. Production transaction is accepted for entitlement", () => {
  const appleIap = freshAppleIap({ APPLE_IAP_ALLOW_SANDBOX: undefined });
  assert.equal(appleIap.isEnvironmentAllowedForEntitlement(appleIap.Environment.PRODUCTION), true);
});

test("B. Sandbox transaction is rejected by default (APPLE_IAP_ALLOW_SANDBOX unset)", () => {
  const appleIap = freshAppleIap({ APPLE_IAP_ALLOW_SANDBOX: undefined });
  assert.equal(appleIap.isEnvironmentAllowedForEntitlement(appleIap.Environment.SANDBOX), false);
});

test("B(alt). Sandbox transaction is rejected when APPLE_IAP_ALLOW_SANDBOX=false explicitly", () => {
  const appleIap = freshAppleIap({ APPLE_IAP_ALLOW_SANDBOX: "false" });
  assert.equal(appleIap.isEnvironmentAllowedForEntitlement(appleIap.Environment.SANDBOX), false);
});

test("B(staging). Sandbox transaction IS accepted when APPLE_IAP_ALLOW_SANDBOX=true (opt-in only)", () => {
  const appleIap = freshAppleIap({ APPLE_IAP_ALLOW_SANDBOX: "true" });
  assert.equal(appleIap.isEnvironmentAllowedForEntitlement(appleIap.Environment.SANDBOX), true);
  // Production must remain accepted regardless of this flag.
  assert.equal(appleIap.isEnvironmentAllowedForEntitlement(appleIap.Environment.PRODUCTION), true);
});

test("9./D. Existing originalTransactionId cross-firm ownership protection still works", () => {
  const appleIap = freshAppleIap();
  assert.equal(appleIap.isOwnedByDifferentFirm("firmA", "firmB"), true);
  assert.equal(appleIap.isOwnedByDifferentFirm("firmA", "firmA"), false);
  // No existing owner yet (new transaction) -- not a conflict.
  assert.equal(appleIap.isOwnedByDifferentFirm(null, "firmB"), false);
  assert.equal(appleIap.isOwnedByDifferentFirm(undefined, "firmB"), false);
  // ObjectId-like objects compare by their string form, not identity.
  assert.equal(appleIap.isOwnedByDifferentFirm({ toString: () => "firmA" }, "firmA"), false);
});

test("G. An expired transaction (no renewal info) resolves to not-entitled/expired", () => {
  const appleIap = freshAppleIap();
  const expiredTxn = { expiresDate: Date.now() - 1000 };
  assert.equal(appleIap.currentlyEntitled(expiredTxn), false);
  const verdict = appleIap.resolveEntitlement(expiredTxn, null);
  assert.equal(verdict.entitled, false);
  assert.equal(verdict.reason, "expired");
  assert.equal(verdict.endDateMs, null);
});

test("H. A revoked/refunded transaction resolves to cancelled, even with grace-period renewal info present", () => {
  const appleIap = freshAppleIap();
  const revokedTxn = { expiresDate: Date.now() + 100000, revocationDate: Date.now() - 1000 };
  assert.equal(appleIap.isTransactionRevoked(revokedTxn), true);
  const renewalInfoWithGrace = {
    isInBillingRetryPeriod: true,
    gracePeriodExpiresDate: Date.now() + 50000,
  };
  const verdict = appleIap.resolveEntitlement(revokedTxn, renewalInfoWithGrace);
  assert.equal(verdict.entitled, false);
  assert.equal(verdict.reason, "revoked");
});

test("I. A grace-period transaction remains entitled until the grace boundary", () => {
  const appleIap = freshAppleIap();
  const expiredTxn = { expiresDate: Date.now() - 1000 };
  const graceEnd = Date.now() + 50000;
  const activeGraceRenewalInfo = { isInBillingRetryPeriod: true, gracePeriodExpiresDate: graceEnd };
  const verdict = appleIap.resolveEntitlement(expiredTxn, activeGraceRenewalInfo);
  assert.equal(verdict.entitled, true);
  assert.equal(verdict.reason, "grace_period");
  assert.equal(verdict.endDateMs, graceEnd);
  // Bounded, not indefinite: endDateMs is a concrete, real timestamp.
  assert.equal(typeof verdict.endDateMs, "number");
});

test("J. Once the grace period itself has expired, access ends", () => {
  const appleIap = freshAppleIap();
  const expiredTxn = { expiresDate: Date.now() - 100000 };
  const expiredGraceRenewalInfo = {
    isInBillingRetryPeriod: true,
    gracePeriodExpiresDate: Date.now() - 1000, // grace boundary itself has passed
  };
  const verdict = appleIap.resolveEntitlement(expiredTxn, expiredGraceRenewalInfo);
  assert.equal(verdict.entitled, false);
  assert.equal(verdict.reason, "expired");
});

test("J(alt). Renewal info present but isInBillingRetryPeriod=false does not grant a grace period", () => {
  const appleIap = freshAppleIap();
  const expiredTxn = { expiresDate: Date.now() - 1000 };
  const notInRetryRenewalInfo = {
    isInBillingRetryPeriod: false,
    gracePeriodExpiresDate: Date.now() + 50000, // present, but not applicable
  };
  const verdict = appleIap.resolveEntitlement(expiredTxn, notInRetryRenewalInfo);
  assert.equal(verdict.entitled, false);
  assert.equal(verdict.reason, "expired");
});

test("Active (unexpired, unrevoked) transaction resolves to entitled/active using its own expiresDate", () => {
  const appleIap = freshAppleIap();
  const expiresDate = Date.now() + 100000;
  const activeTxn = { expiresDate };
  const verdict = appleIap.resolveEntitlement(activeTxn, null);
  assert.equal(verdict.entitled, true);
  assert.equal(verdict.reason, "active");
  assert.equal(verdict.endDateMs, expiresDate);
});

// appAccountTokenMatches is FAIL CLOSED -- RatnSetu's Apple IAP has never
// been live in production, so there is no legacy token-less subscription
// to stay compatible with. An earlier version of this function returned
// `true` (accept) whenever either side was absent; that was a confirmed
// fail-open gap (Apple transactions without a token, or firms without one,
// were silently accepted) and has been removed. These five tests are the
// exact scenarios from that fix's spec.
test("1. token + matching firm token -> PASS (accepted)", () => {
  const appleIap = freshAppleIap();
  assert.equal(appleIap.appAccountTokenMatches("firm-A-token", "firm-A-token"), true);
});

test("2. token + mismatching firm token -> REJECT", () => {
  const appleIap = freshAppleIap();
  assert.equal(appleIap.appAccountTokenMatches("firm-A-token", "firm-B-token"), false);
});

test("3. missing Apple token + firm HAS a token -> REJECT", () => {
  const appleIap = freshAppleIap();
  assert.equal(appleIap.appAccountTokenMatches(undefined, "firm-A-token"), false);
  assert.equal(appleIap.appAccountTokenMatches(null, "firm-A-token"), false);
  assert.equal(appleIap.appAccountTokenMatches("", "firm-A-token"), false);
});

test("4. Apple token present + firm is MISSING a token -> REJECT", () => {
  const appleIap = freshAppleIap();
  assert.equal(appleIap.appAccountTokenMatches("apple-token", undefined), false);
  assert.equal(appleIap.appAccountTokenMatches("apple-token", null), false);
  assert.equal(appleIap.appAccountTokenMatches("apple-token", ""), false);
});

test("5. both missing -> REJECT", () => {
  const appleIap = freshAppleIap();
  assert.equal(appleIap.appAccountTokenMatches(undefined, undefined), false);
  assert.equal(appleIap.appAccountTokenMatches(null, null), false);
});
