// Unit tests for the PURE plan-entitlement rules (Utils/planAccess.js): what
// Basic / Pro / trial / ended subscriptions are allowed to do. No DB, no
// network. Run with: node --test test/planAccess.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { entitlementsFor, planIncludesGirvi, planMaxStaff } = require("../Utils/planAccess");

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-05T12:00:00Z").getTime();
const inDays = (n) => new Date(NOW + n * DAY);
const basic = { key: "basic", name: "Basic", maxStaff: 3, includesGirvi: false };
const pro = { key: "pro", name: "Pro", maxStaff: 0, includesGirvi: true };

test("Basic (paid, active): no Girvi, 3 staff accounts", () => {
  const e = entitlementsFor({ status: "active", endDate: inDays(100), plan: basic }, NOW);
  assert.deepEqual(e, { state: "active", girvi: false, staffLimit: 3 });
});

test("Pro (paid, active): Girvi, unlimited staff", () => {
  const e = entitlementsFor({ status: "active", endDate: inDays(100), plan: pro }, NOW);
  assert.deepEqual(e, { state: "active", girvi: true, staffLimit: 0 });
});

test("running trial gets Pro-level access whatever plan row it points at", () => {
  const e = entitlementsFor({ status: "trialing", endDate: inDays(5), plan: basic }, NOW);
  assert.deepEqual(e, { state: "trial", girvi: true, staffLimit: 0 });
});

test("ended / cancelled / no subscription: nothing is entitled", () => {
  for (const sub of [
    { status: "active", endDate: inDays(-1), plan: pro }, // lapsed but still 'active' in the DB
    { status: "trialing", endDate: inDays(-1), plan: basic },
    { status: "expired", endDate: inDays(50), plan: pro },
    { status: "cancelled", endDate: inDays(50), plan: pro },
    null,
  ]) {
    const e = entitlementsFor(sub, NOW);
    assert.equal(e.girvi, false);
    assert.equal(e.staffLimit, 0);
  }
});

test("plan rows from before the new fields existed fall back by key (Pro keeps Girvi)", () => {
  assert.equal(planIncludesGirvi({ key: "pro" }), true);
  assert.equal(planIncludesGirvi({ key: "basic" }), false);
  assert.equal(planIncludesGirvi({ key: "something-new" }), false);
  assert.equal(planMaxStaff({ key: "basic" }), 3);
  assert.equal(planMaxStaff({ key: "pro" }), 0);
});

test("an explicit flag on the plan row wins over the key default", () => {
  assert.equal(planIncludesGirvi({ key: "basic", includesGirvi: true }), true);
  assert.equal(planIncludesGirvi({ key: "pro", includesGirvi: false }), false);
  assert.equal(planMaxStaff({ key: "basic", maxStaff: 10 }), 10);
});
