// Unit tests for the PURE helpers behind the platform-owner panel
// (Utils/platformStats.js) and the role guard (Utils/roles.js). No DB, no
// network: plain data in, plain data out.
//
// Run with: node --test test/platformStats.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  effectiveSubscriptionState,
  lastMonthKeys,
  fillMonths,
  monthKeyOf,
  summarizeSubscriptions,
  escapeRegExp,
  DAY_MS,
} = require("../Utils/platformStats");
const { isAssignableRole } = require("../Utils/roles");

const NOW = new Date("2026-10-05T12:00:00Z").getTime();
const inDays = (n) => new Date(NOW + n * DAY_MS);
const basic = { key: "basic", name: "Basic", price: 14999 };
const pro = { key: "pro", name: "Pro", price: 29999 };

test("effectiveSubscriptionState follows the same rule as the access gate", () => {
  assert.equal(effectiveSubscriptionState(null, NOW), "none");
  assert.equal(effectiveSubscriptionState({ status: "trialing", endDate: inDays(5) }, NOW), "trial");
  assert.equal(effectiveSubscriptionState({ status: "active", endDate: inDays(5) }, NOW), "active");
  // still "active" in the DB but the end date passed -> not entitled
  assert.equal(effectiveSubscriptionState({ status: "active", endDate: inDays(-1) }, NOW), "expired");
  assert.equal(effectiveSubscriptionState({ status: "trialing", endDate: inDays(-1) }, NOW), "expired");
  assert.equal(effectiveSubscriptionState({ status: "expired", endDate: inDays(30) }, NOW), "expired");
  assert.equal(effectiveSubscriptionState({ status: "cancelled", endDate: inDays(30) }, NOW), "cancelled");
});

test("lastMonthKeys returns n calendar months, oldest first, across a year boundary", () => {
  assert.deepEqual(lastMonthKeys(3, new Date("2026-01-15T00:00:00Z")), ["2025-11", "2025-12", "2026-01"]);
  assert.equal(lastMonthKeys(12, new Date(NOW)).length, 12);
  assert.equal(lastMonthKeys(12, new Date(NOW)).at(-1), "2026-10");
});

test("fillMonths fills gaps with zeros and keeps real rows", () => {
  const keys = ["2026-08", "2026-09", "2026-10"];
  const out = fillMonths(keys, [{ _id: "2026-09", count: 4, amount: 900 }], { count: 0, amount: 0 });
  assert.deepEqual(out, [
    { month: "2026-08", count: 0, amount: 0 },
    { month: "2026-09", count: 4, amount: 900 },
    { month: "2026-10", count: 0, amount: 0 },
  ]);
});

test("monthKeyOf is UTC based", () => {
  assert.equal(monthKeyOf("2026-09-30T23:59:59Z"), "2026-09");
  assert.equal(monthKeyOf("2026-10-01T00:00:00Z"), "2026-10");
});

test("summarizeSubscriptions counts states, plans, providers and expiry windows", () => {
  const firms = ["f1", "f2", "f3", "f4", "f5", "f6"];
  const subs = [
    { firm: "f1", plan: pro, status: "active", endDate: inDays(200), paymentProvider: "razorpay", amountPaid: 29999 },
    { firm: "f2", plan: basic, status: "active", endDate: inDays(5), paymentProvider: "apple_iap", amountPaid: 14999 },
    { firm: "f3", plan: basic, status: "trialing", endDate: inDays(9), paymentProvider: "none", amountPaid: 0 },
    { firm: "f4", plan: pro, status: "expired", endDate: inDays(-10), paymentProvider: "razorpay", amountPaid: 29999 },
    { firm: "f5", plan: pro, status: "cancelled", endDate: inDays(-1), paymentProvider: "razorpay", amountPaid: 29999 },
    // f6: no subscription row at all
    // a subscription of a firm that is NOT in the list (removed firm) must be ignored
    { firm: "gone", plan: pro, status: "active", endDate: inDays(100), paymentProvider: "razorpay", amountPaid: 1 },
  ];
  const s = summarizeSubscriptions(firms, subs, NOW);
  assert.equal(s.totalFirms, 6);
  assert.deepEqual(s.states, { none: 1, trial: 1, active: 2, expired: 1, cancelled: 1 });
  assert.equal(s.paidActive, 2);
  assert.equal(s.activePaidValue, 29999 + 14999);
  assert.deepEqual(s.providers, { razorpay: 1, apple_iap: 1, manual: 0, none: 0 });
  assert.equal(s.expiringWithin7Days, 1); // only f2 (active, 5 days left)
  assert.equal(s.expiringWithin30Days, 2); // f2 + f3 (trial, 9 days)
  const proRow = s.byPlan.find((p) => p.key === "pro");
  const basicRow = s.byPlan.find((p) => p.key === "basic");
  assert.deepEqual([proRow.active, proRow.ended, proRow.trial], [1, 2, 0]);
  assert.deepEqual([basicRow.active, basicRow.ended, basicRow.trial], [1, 0, 1]);
});

test("escapeRegExp makes search input safe to put in a RegExp", () => {
  const re = new RegExp(escapeRegExp("a.b(c)[d]*"), "i");
  assert.ok(re.test("xx A.B(C)[D]* yy"));
  assert.ok(!re.test("a-b(c)[d]*"));
});

test("only firm roles are assignable; superadmin never is", () => {
  for (const ok of ["admin", "staff", "user"]) assert.equal(isAssignableRole(ok), true);
  for (const bad of ["superadmin", "SUPERADMIN", "root", "", undefined, null, 5, "Admin"])
    assert.equal(isAssignableRole(bad), false);
});
