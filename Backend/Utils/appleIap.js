// Apple In-App Purchase verification, isolated here the same way
// Utils/razorpay.js isolates Razorpay -- nothing outside this file should
// import @apple/app-store-server-library directly.
//
// This module NEVER trusts anything the client (Flutter/iOS) says about
// price, plan, expiry, or purchase status. It only ever takes a
// `transactionId` from the client (to know *which* transaction to ask
// about) and independently re-fetches that transaction's signed JWS from
// Apple's own App Store Server API, then cryptographically verifies it
// with Apple's official SignedDataVerifier (chain-of-trust up to Apple's
// own Root CA, bundled in ./appleRootCertificates -- these are Apple's
// public certificates, not secrets). This is stronger than trusting a
// signedTransactionInfo string relayed by the client: even though that
// string would itself still be cryptographically genuine, fetching it
// fresh from Apple guarantees we see the *current* state (e.g. a refund
// issued after purchase) rather than whatever the client cached at
// purchase time.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  SignedDataVerifier,
  AppStoreServerAPIClient,
  Environment,
  APIException,
  APIError,
} = require("@apple/app-store-server-library");

const BUNDLE_ID = process.env.APPLE_BUNDLE_ID || "com.ratnsetu.app";
const APP_APPLE_ID = process.env.APPLE_APP_APPLE_ID
  ? Number(process.env.APPLE_APP_APPLE_ID)
  : undefined;

// "Production" unless explicitly overridden -- Sandbox receipts arriving
// against the Production endpoint are handled by the fallback in
// fetchVerifiedTransaction below (this is Apple's own documented pattern
// for a single server integration that serves both TestFlight/sandbox
// testers and real customers without needing two deployments). This only
// controls which environment is TRIED FIRST when verifying a transaction's
// signature -- it does NOT by itself decide whether a Sandbox transaction
// is allowed to grant real entitlement; see ALLOW_SANDBOX below for that.
const DEFAULT_ENVIRONMENT =
  process.env.APPLE_IAP_ENVIRONMENT === "Sandbox"
    ? Environment.SANDBOX
    : Environment.PRODUCTION;

// Whether a cryptographically-genuine SANDBOX transaction is allowed to
// activate a real Subscription. Defaults to false (fail CLOSED) so a
// missing/misconfigured env var never accidentally opens this up -- a
// Sandbox Apple ID costs nothing to create, so without this gate anyone
// could "buy" a subscription for free and have it accepted as a real
// payment. Set APPLE_IAP_ALLOW_SANDBOX=true only for a staging/dev
// deployment, never in production.
const ALLOW_SANDBOX = process.env.APPLE_IAP_ALLOW_SANDBOX === "true";

// True only for a Production transaction, or a Sandbox one when the
// deployment has explicitly opted in via ALLOW_SANDBOX. Callers must check
// this before ever calling activatePaidSubscription with Apple-verified
// data -- verification proves the transaction is cryptographically genuine
// and currently valid, but says nothing about which *environment* it came
// from, and a genuine Sandbox transaction must never be treated as a real
// payment in production.
function isEnvironmentAllowedForEntitlement(environment) {
  if (environment === Environment.PRODUCTION) return true;
  return environment === Environment.SANDBOX && ALLOW_SANDBOX;
}

// Apple's own public root certificates -- not secret, safe to commit.
// Downloaded from https://www.apple.com/certificateauthority/ (see
// appleRootCertificates/NOTES.md). Drop additional .cer files in here if
// Apple ever adds/rotates one; every .cer in the directory is loaded.
const ROOT_CERT_DIR = path.join(__dirname, "appleRootCertificates");
function loadRootCertificates() {
  const files = fs.readdirSync(ROOT_CERT_DIR).filter((f) => f.endsWith(".cer"));
  if (files.length === 0) {
    throw new Error(
      `No Apple root certificates found in ${ROOT_CERT_DIR} -- see appleRootCertificates/NOTES.md`
    );
  }
  return files.map((f) => fs.readFileSync(path.join(ROOT_CERT_DIR, f)));
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set -- add it to Backend/.env`);
  }
  return value;
}

// The .p8 private key App Store Connect gives you once, at creation time.
// Accepts either the raw PEM text (env vars commonly need "\n" escaped
// literally) or a path to the downloaded file, whichever is easier for the
// deployment target.
function readPrivateKey() {
  if (process.env.APPLE_IAP_PRIVATE_KEY) {
    return process.env.APPLE_IAP_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  if (process.env.APPLE_IAP_PRIVATE_KEY_PATH) {
    return fs.readFileSync(process.env.APPLE_IAP_PRIVATE_KEY_PATH, "utf8");
  }
  throw new Error(
    "APPLE_IAP_PRIVATE_KEY or APPLE_IAP_PRIVATE_KEY_PATH must be set -- add one to Backend/.env"
  );
}

// Constructed lazily (one per Environment actually used), same reasoning as
// Utils/razorpay.js's getRazorpay(): building these eagerly at module-load
// time would crash the *entire* server on boot whenever Apple env vars
// simply haven't been set yet (e.g. before the iOS build exists), not just
// the Apple IAP routes.
const _verifiers = {};
function getVerifier(environment) {
  if (!_verifiers[environment]) {
    _verifiers[environment] = new SignedDataVerifier(
      loadRootCertificates(),
      true, // enableOnlineChecks: real revocation/expiry checking, not just JWS shape
      environment,
      BUNDLE_ID,
      APP_APPLE_ID
    );
  }
  return _verifiers[environment];
}

const _apiClients = {};
function getApiClient(environment) {
  if (!_apiClients[environment]) {
    _apiClients[environment] = new AppStoreServerAPIClient(
      readPrivateKey(),
      requiredEnv("APPLE_IAP_KEY_ID"),
      requiredEnv("APPLE_IAP_ISSUER_ID"),
      BUNDLE_ID,
      environment
    );
  }
  return _apiClients[environment];
}

function isTransactionIdNotFound(error) {
  return (
    error instanceof APIException &&
    (error.apiError === APIError.TRANSACTION_ID_NOT_FOUND ||
      error.apiError === APIError.ORIGINAL_TRANSACTION_ID_NOT_FOUND ||
      error.httpStatusCode === 404)
  );
}

// Independently establishes, from Apple's own servers, the verified,
// current state of a transaction -- given only its id. Tries the
// configured environment first; if Apple reports the id doesn't exist
// there, retries the other environment once (a Sandbox/TestFlight tester's
// transaction won't exist in Production and vice versa -- this fallback is
// Apple's own documented way to support both from one backend).
async function fetchVerifiedTransaction(transactionId) {
  const primary = DEFAULT_ENVIRONMENT;
  const fallback =
    primary === Environment.PRODUCTION ? Environment.SANDBOX : Environment.PRODUCTION;

  let lastError;
  for (const environment of [primary, fallback]) {
    try {
      const response = await getApiClient(environment).getTransactionInfo(transactionId);
      const decoded = await getVerifier(environment).verifyAndDecodeTransaction(
        response.signedTransactionInfo
      );
      return { decoded, environment };
    } catch (error) {
      lastError = error;
      if (!isTransactionIdNotFound(error)) {
        throw error;
      }
      // else: fall through and try the other environment
    }
  }
  throw lastError;
}

// True once Apple has refunded or revoked (e.g. Family Sharing access
// removed) this transaction -- must never grant/extend entitlement.
function isTransactionRevoked(decodedTransaction) {
  return Boolean(decodedTransaction.revocationDate);
}

// Apple's own answer to "is this subscription currently entitled, going by
// the transaction alone" -- expiresDate is the UNIX-ms time it expires or
// next renews. Does NOT account for a billing-retry grace period -- that
// lives on the separate renewal info (see gracePeriodEndDateMs/
// resolveEntitlement below), not on the transaction.
function currentlyEntitled(decodedTransaction) {
  if (isTransactionRevoked(decodedTransaction)) return false;
  if (!decodedTransaction.expiresDate) return false;
  return decodedTransaction.expiresDate > Date.now();
}

// Apple's billing-retry grace period lives entirely on the RENEWAL info
// (JWSRenewalInfoDecodedPayload), not the transaction -- a subscription
// whose transaction.expiresDate has already passed can still be validly
// entitled if Apple is still retrying the charge and the customer is
// within the grace window. Returns a concrete UNIX-ms boundary (never
// null-as-"forever") so entitlement during billing retry is always
// time-bounded, never indefinite.
function gracePeriodEndDateMs(decodedRenewalInfo) {
  if (!decodedRenewalInfo) return null;
  if (!decodedRenewalInfo.isInBillingRetryPeriod) return null;
  if (!decodedRenewalInfo.gracePeriodExpiresDate) return null;
  return decodedRenewalInfo.gracePeriodExpiresDate > Date.now()
    ? decodedRenewalInfo.gracePeriodExpiresDate
    : null;
}

// The single place that turns a verified transaction (+ optional verified
// renewal info) into an entitlement verdict. Pure function -- no I/O, no
// Date.now() surprises beyond what currentlyEntitled/gracePeriodEndDateMs
// already isolate -- so it's directly unit-testable.
//
// endDateMs is always either the transaction's own expiresDate or a real
// Apple-provided gracePeriodExpiresDate -- never fabricated, never
// indefinite.
function resolveEntitlement(decodedTransaction, decodedRenewalInfo) {
  if (isTransactionRevoked(decodedTransaction)) {
    return { entitled: false, endDateMs: null, reason: "revoked" };
  }
  if (currentlyEntitled(decodedTransaction)) {
    return { entitled: true, endDateMs: decodedTransaction.expiresDate, reason: "active" };
  }
  const graceEnd = gracePeriodEndDateMs(decodedRenewalInfo);
  if (graceEnd) {
    return { entitled: true, endDateMs: graceEnd, reason: "grace_period" };
  }
  return { entitled: false, endDateMs: null, reason: "expired" };
}

// True if `existingFirmId` (the firm a Subscription doc with this Apple
// transaction is already associated with) is a different firm than the one
// making the current request -- the core check behind the cross-firm
// ownership guard in verifyAppleSubscription/appleAppStoreNotifications.
// Pure/comparison-only so it's unit-testable without a DB.
function isOwnedByDifferentFirm(existingFirmId, requestingFirmId) {
  if (!existingFirmId) return false;
  return String(existingFirmId) !== String(requestingFirmId);
}

// True if the verified transaction's appAccountToken (if any) matches this
// firm's own stored token -- i.e. "no conflict found". Returns true
// (nothing to object to) whenever there's nothing to compare: the
// transaction carries no token (older client build, or a purchase made
// before this feature existed) or the firm has none yet (ditto) --
// verifyAppleSubscription treats this as an ADDITIONAL layer on top of the
// always-on originalTransactionId ownership lookup (isOwnedByDifferentFirm
// above), never a replacement for it, precisely so those absent-token
// cases stay safe rather than silently unchecked.
function appAccountTokenMatches(decodedAppAccountToken, firmAppleAppAccountToken) {
  if (!decodedAppAccountToken || !firmAppleAppAccountToken) return true;
  return decodedAppAccountToken === firmAppleAppAccountToken;
}

// Apple productId -> internal SubscriptionPlan, via the plan's own
// appleProductId field (Backend/Models/SubscriptionPlanModel.js) -- never
// hardcoded here or in the controller, and never taken from the client.
async function resolvePlanForProductId(productId) {
  const SubscriptionPlanModel = require("../Models/SubscriptionPlanModel");
  const plan = await SubscriptionPlanModel.findOne({ appleProductId: productId, isActive: true });
  if (!plan) {
    throw new Error(`No active SubscriptionPlan maps to Apple product "${productId}"`);
  }
  return plan;
}

// The Firm's stable, one-time-generated UUID, sent by the Flutter client on
// every purchase/restore as StoreKit's `appAccountToken`
// (PurchaseParam.applicationUserName -- see in_app_purchase_storekit
// 0.4.13's in_app_purchase_storekit_platform.dart, which passes
// applicationUserName straight through as appAccountToken) and checked
// against the verified transaction's own appAccountToken in
// verifyAppleSubscription. This is what lets a purchase be bound to a
// specific RatnSetu firm at the StoreKit level, not just inferred from
// "whichever firm happened to be logged in."
//
// Generated lazily, exactly once per firm (never regenerated on each
// purchase) -- the $exists guard on the update makes two concurrent
// first-calls for the same firm converge on one winner's token rather than
// racing to set two different values.
async function ensureAppleAppAccountToken(firmId) {
  const FirmModel = require("../Models/FirmModel");
  const existing = await FirmModel.findById(firmId).select("appleAppAccountToken");
  if (existing?.appleAppAccountToken) return existing.appleAppAccountToken;

  const token = crypto.randomUUID();
  const updated = await FirmModel.findOneAndUpdate(
    { _id: firmId, appleAppAccountToken: { $exists: false } },
    { $set: { appleAppAccountToken: token } },
    { new: true }
  );
  if (updated) return updated.appleAppAccountToken;

  // Lost the race to a concurrent call for the same firm -- use whatever
  // the winner actually persisted, not the token generated here.
  const winner = await FirmModel.findById(firmId).select("appleAppAccountToken");
  return winner?.appleAppAccountToken ?? token;
}

module.exports = {
  Environment,
  fetchVerifiedTransaction,
  isTransactionRevoked,
  currentlyEntitled,
  gracePeriodEndDateMs,
  resolveEntitlement,
  isOwnedByDifferentFirm,
  appAccountTokenMatches,
  isEnvironmentAllowedForEntitlement,
  resolvePlanForProductId,
  ensureAppleAppAccountToken,
  getVerifier,
  DEFAULT_ENVIRONMENT,
  ALLOW_SANDBOX,
};
