# Platform admin panel (platform owner)

A read-only panel, inside the existing web app, that shows every firm on RatnSetu, which plan each has,
and app-wide usage. It is for the **platform owner only** -- not for shop admins.

## Create the owner account (once)

There is deliberately no signup or API for this role. From the `Backend/` folder, with the production `.env`:

```
node seed/createSuperAdmin.js "Owner Name" owner@example.com 9999999999 a-strong-password
```

- Creates a user with role `superadmin` and **no firm**. It refuses to reuse an email that already exists.
- Log in on the normal web login page. You land on `/platform-admin`; shop screens are not available to this role.

## What it shows

| Page | URL | Contents |
|---|---|---|
| Overview | `/platform-admin` | Firms, paid/trial/expired/cancelled/none counts, plans taken (incl. unsold plans), Razorpay vs Apple split, expiring in 7/30 days, record totals, new firms per month |
| Firms & Subscribers | `/platform-admin/firms` | Searchable/filterable/sortable list: owner, plan, status, end date, users, customers, stock, sales |
| Firm detail | `/platform-admin/firms/:id` | Subscription, owner/contact, usage, users, recent activity |
| App Usage | `/platform-admin/usage` | Sales per month, top firms by sales, activity by type (30 days) |

## Notes and limits

- **Read-only.** There are no write endpoints under `/api/admin/platform`.
- A subscription row stores only the **latest** payment, so the panel shows "latest paid amounts of active plans",
  not lifetime revenue. Lifetime revenue would need a payment-history collection.
- A firm's status is computed the same way the access gate does it: `trialing`/`active` **and** `endDate` not passed.
  The database can still say `active` for a lapsed subscription until that firm next makes a request; the panel shows it as Expired.
- The Apple/Razorpay backend does not store an auto-renew flag, so "will it renew" cannot be shown.
- Removed (deleted) firms are excluded from every number.

## Security

- Every route requires login **and** role `superadmin`, checked against the live database role (not the token claim).
- `superadmin` cannot be assigned through `POST /admin/register` or `POST /UpdateUser`
  (only `admin`, `staff`, `user` are assignable -- `Backend/Utils/roles.js`).
- Responses never include passwords or tokens.
