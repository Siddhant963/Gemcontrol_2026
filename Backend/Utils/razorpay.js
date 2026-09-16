const Razorpay = require("razorpay");
const crypto = require("crypto");
// Razorpay's own maintained webhook-signature check -- don't hand-roll this
// one, it's timing-safe and kept in sync with their signing scheme.
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");

// Constructed lazily, on first actual use, rather than at module-load time --
// the Razorpay SDK throws synchronously if key_id is missing, which would
// otherwise crash the *entire* server (every unrelated route too) on boot
// whenever the Razorpay env vars simply haven't been set yet. Deferring
// construction means only a request that actually touches a subscription
// endpoint fails until the keys are added.
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set -- add them to Backend/.env"
      );
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

// Proxy so callers can keep writing `razorpay.orders.create(...)` unchanged
// -- the getter above only actually runs (and only actually throws) the
// first time a property is accessed, not at require() time.
const razorpay = new Proxy(
  {},
  {
    get(_target, prop) {
      return getRazorpay()[prop];
    },
  }
);

// Verifies the {razorpay_order_id, razorpay_payment_id, razorpay_signature}
// trio handed back by Checkout (web) / the razorpay_flutter success
// callback (mobile, after remapping its camelCase fields) once a payment
// completes client-side.
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

module.exports = {
  razorpay,
  verifyPaymentSignature,
  validateWebhookSignature,
};
