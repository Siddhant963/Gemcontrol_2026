// Single source of truth for "what RatnSetu does" copy, reused across Home,
// the Features page, and (short-form) the Pricing plan bullets.
export const FEATURES = [
  {
    icon: "inventory_2",
    title: "Inventory Management",
    short: "Track every item and raw material with live gold, silver and diamond rates.",
    detail:
      "Keep your full stock — finished jewellery and raw material — in one system instead of a register. Every item is tracked against live gold, silver and diamond rates, so valuations stay accurate without manual recalculation.",
  },
  {
    icon: "shopping_cart",
    title: "Purchase Management",
    short: "Record purchases from suppliers as they happen, with stock updated automatically.",
    detail:
      "Log every purchase against a supplier and it reflects in your stock immediately — no separate purchase register to reconcile against inventory counts later.",
  },
  {
    icon: "receipt_long",
    title: "Sales Management",
    short: "GST-compliant billing and invoicing, generated in seconds.",
    detail:
      "Create accurate, tax-ready invoices with full GST breakdowns, using the same live rates and stock records — sales, stock, and accounts stay in sync automatically.",
  },
  {
    icon: "group",
    title: "Customer Management",
    short: "Every customer's purchase history and outstanding credit, in one place.",
    detail:
      "Search a customer once and see their full history — past purchases, current dues, and contact details — instead of checking multiple registers or files.",
  },
  {
    icon: "account_balance_wallet",
    title: "Udhaar & Outstanding",
    short: "Track customer credit (Udhaar) clearly, without scattered notebooks.",
    detail:
      "See exactly who owes what, and since when, across all your customers in one ledger — instead of piecing it together from notebooks or memory.",
  },
  {
    icon: "local_shipping",
    title: "Supplier Management",
    short: "Keep supplier records and purchase history organized.",
    detail:
      "Maintain a clear record of every supplier you work with, alongside the purchases made from them, so sourcing history is never lost.",
  },
  {
    icon: "bar_chart",
    title: "Business Reports",
    short: "Real-time visibility into stock, sales and dues — no manual tallying.",
    detail:
      "Get a clear picture of daily sales, stock position and outstanding dues without manually tallying registers at the end of the day.",
  },
  {
    icon: "badge",
    title: "Multi-user Management",
    short: "Give staff role-based access under one shop account, admin-controlled.",
    detail:
      "Add staff accounts under your shop with admin-controlled access, so multiple people can work in the system without losing track of who did what.",
  },
];

// Shown as the compact 6-card grid on Home, in the original app order/copy.
export const HOME_FEATURE_HIGHLIGHTS = [
  FEATURES[0],
  FEATURES[2],
  FEATURES[3],
  FEATURES[4],
  FEATURES[7],
  {
    icon: "phone_iphone",
    title: "Web & Mobile Access",
    short: "Manage your shop from the web dashboard or the RatnSetu Android app, in sync.",
    detail:
      "Use RatnSetu from your shop's computer or from the Android app on the move — both stay in sync against the same business data.",
  },
];

export const PROBLEM_SOLUTION_ITEMS = [
  {
    problem: "Manual stock tracking across registers",
    solution: "One live inventory record, updated with every purchase and sale.",
  },
  {
    problem: "Difficulty finding a customer's purchase history",
    solution: "Search a customer once to see their full purchase and payment history.",
  },
  {
    problem: "Udhaar records scattered across notebooks",
    solution: "A single Udhaar ledger showing exactly who owes what.",
  },
  {
    problem: "Difficulty tracking purchases from suppliers",
    solution: "Every purchase logged against a supplier, reflected in stock automatically.",
  },
  {
    problem: "Stock discrepancies discovered too late",
    solution: "Real-time stock counts instead of periodic manual reconciliation.",
  },
  {
    problem: "Lack of real-time business visibility",
    solution: "A dashboard view of sales, stock and dues, updated as you work.",
  },
  {
    problem: "Multiple staff handling records inconsistently",
    solution: "Role-based staff accounts under one shop, admin-controlled.",
  },
  {
    problem: "Time spent maintaining paper registers",
    solution: "Records entered once, used everywhere — billing, stock, and reports.",
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Create Your Business",
    description: "Set up your shop's account and business details to get started.",
  },
  {
    step: 2,
    title: "Set Up Products & Inventory",
    description: "Add your jewellery items and raw materials into the system.",
  },
  {
    step: 3,
    title: "Manage Purchases & Sales",
    description: "Record purchases from suppliers and sales to customers as they happen.",
  },
  {
    step: 4,
    title: "Track Customers & Outstanding",
    description: "Keep customer purchase history and Udhaar dues organized in one place.",
  },
  {
    step: 5,
    title: "Understand Your Business",
    description: "See stock, sales and outstanding dues clearly, whenever you need to.",
  },
];
