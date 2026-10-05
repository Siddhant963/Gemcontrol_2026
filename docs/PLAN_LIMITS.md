# What Basic and Pro actually allow

Plan text used to be display-only. These rules are now **enforced by the backend**
(`Backend/Utils/planAccess.js`); the web and Flutter apps only explain the limit and disable the button.

| | Free trial (14 days) | Basic | Pro |
|---|---|---|---|
| Stock, raw materials, rates, GST billing, udhar, customers, Excel export | yes | yes | yes |
| Staff accounts (besides the owner) | unlimited | up to **3** | unlimited |
| Create NEW Girvi / Borrows entries | yes | **no** | yes |

- A running trial gets Pro-level access. When it ends, the plan's limits apply.
- **Nothing is deleted.** A Basic firm that already has Girvi loans or more than 3 staff keeps them: it can still view
  loans, collect payments and redeem them. It just can't create new Girvi entries or add more staff.
- Blocked actions return `403` with `code: "PLAN_UPGRADE_REQUIRED"` and a readable message.
- `GET /getMySubscription` now also returns `entitlements: { girvi, staffLimit (0 = unlimited), staffUsed }`.
- Plan rows carry `maxStaff` and `includesGirvi`. Rows saved before these fields existed fall back by plan key
  (`pro` has Girvi, `basic` has 3 staff), so nobody is locked out before the seed is re-run.
  Run `node seed/seedSubscriptionPlans.js` (from `Backend/`) to store the values explicitly.
- Not enforceable in code: "Priority support" (a support process, not a feature).
