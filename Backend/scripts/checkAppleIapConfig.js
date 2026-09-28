// Safe, read-only diagnostic for Apple IAP configuration. Reports only
// non-secret metadata -- which fields are set, whether the .p8 file exists
// and looks like a valid PEM key -- and NEVER prints the private key
// contents, a generated JWT, an authorization token, or any other
// credential value. Safe to run and safe to paste its output anywhere
// (Slack, a PR description, this chat, etc).
//
// Usage (run from the Backend/ directory so it picks up the same .env as
// the server):
//   node scripts/checkAppleIapConfig.js

require("dotenv").config();
const fs = require("fs");

const bundleId = process.env.APPLE_BUNDLE_ID || "com.ratnsetu.app";
const appAppleId = process.env.APPLE_APP_APPLE_ID || null;
const keyId = process.env.APPLE_IAP_KEY_ID || null;
const issuerConfigured = Boolean(process.env.APPLE_IAP_ISSUER_ID);
const environment = process.env.APPLE_IAP_ENVIRONMENT === "Sandbox" ? "Sandbox" : "Production";
const sandboxAllowed = process.env.APPLE_IAP_ALLOW_SANDBOX === "true";

let privateKeySource = "none";
let privateKeyFileExists = false;
let privateKeyReadable = false;

if (process.env.APPLE_IAP_PRIVATE_KEY) {
  privateKeySource = "APPLE_IAP_PRIVATE_KEY (inline env var)";
  privateKeyFileExists = true; // not a file, but "configured" either way
  privateKeyReadable = process.env.APPLE_IAP_PRIVATE_KEY.includes("PRIVATE KEY");
} else if (process.env.APPLE_IAP_PRIVATE_KEY_PATH) {
  privateKeySource = "APPLE_IAP_PRIVATE_KEY_PATH (file)";
  privateKeyFileExists = fs.existsSync(process.env.APPLE_IAP_PRIVATE_KEY_PATH);
  if (privateKeyFileExists) {
    try {
      // Read only to confirm it's readable and PEM-shaped. The contents
      // are held in a local variable for one boolean check and are never
      // logged, returned, or written anywhere.
      const contents = fs.readFileSync(process.env.APPLE_IAP_PRIVATE_KEY_PATH, "utf8");
      privateKeyReadable =
        contents.includes("BEGIN PRIVATE KEY") || contents.includes("BEGIN EC PRIVATE KEY");
    } catch {
      privateKeyReadable = false;
    }
  }
}

console.log("Apple IAP configuration:");
console.log(`Bundle ID: ${bundleId}`);
console.log(`Apple App ID: ${appAppleId ?? "NOT SET"}`);
console.log(`Key ID: ${keyId ?? "NOT SET"}`);
console.log(`Issuer configured: ${issuerConfigured ? "YES" : "NO"}`);
console.log(`Private key source: ${privateKeySource}`);
console.log(`Private key file exists: ${privateKeyFileExists ? "YES" : "NO"}`);
console.log(`Private key readable: ${privateKeyReadable ? "YES" : "NO"}`);
console.log(`Environment: ${environment}`);
console.log(`Sandbox allowed: ${sandboxAllowed ? "YES" : "NO"}`);

if (environment === "Production" && !appAppleId) {
  console.warn(
    "WARNING: APPLE_APP_APPLE_ID is required once APPLE_IAP_ENVIRONMENT=Production but is not set."
  );
}
if (environment === "Production" && sandboxAllowed) {
  console.warn(
    "WARNING: APPLE_IAP_ALLOW_SANDBOX=true while APPLE_IAP_ENVIRONMENT=Production -- " +
      "this must be false in a real production deployment."
  );
}
