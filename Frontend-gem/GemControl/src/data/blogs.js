// Blog content data. Each post uses simple content "blocks" instead of a
// markdown renderer, to avoid pulling in a new dependency for this. Cover
// art is an icon + gradient treatment (see BlogCard/BlogDetailPage), not a
// stock photo -- keeps things honest and dependency-free until real
// photography is available.
const AUTHOR = "RatnSetu Team";

export const BLOGS = [
  {
    slug: "manage-jewellery-shop-inventory-efficiently",
    title: "How to Manage Jewellery Shop Inventory Efficiently",
    category: "Inventory",
    coverIcon: "inventory_2",
    publishedDate: "2026-08-01",
    readingTime: 5,
    shortDescription:
      "Practical ways to keep jewellery stock accurate without depending on memory or multiple registers.",
    seo: {
      title: "How to Manage Jewellery Shop Inventory Efficiently | RatnSetu",
      metaDescription:
        "Practical, realistic ways Indian jewellery retailers can keep stock accurate — from daily counting habits to jewellery inventory management software.",
      primaryKeyword: "jewellery inventory management software",
      secondaryKeywords: ["jewellery stock management software", "jewellery shop management software"],
    },
    content: [
      {
        type: "paragraph",
        text: "Subah shop kholte hi stock check karna, kal ki sales dekhna aur pending payments ka hisaab nikalna jewellery business ka daily routine hai. Lekin jab ye information alag-alag registers, Excel files aur staff ke records mein ho, to ek simple question ka answer bhi time le sakta hai: 'Abhi actual stock mein kya hai?'",
      },
      {
        type: "paragraph",
        text: "Inventory is the single most valuable thing in a jewellery business, both in rupee terms and in trust — customers expect the item they see to actually be available, and owners need to know exactly what they're holding at any given rate. Yet inventory is often the least systematically tracked part of the business.",
      },
      { type: "heading", text: "Why jewellery inventory is harder than regular retail stock" },
      {
        type: "paragraph",
        text: "Unlike a general store, jewellery stock isn't static — its value moves with gold, silver and diamond rates every day. An item bought last month at one rate needs to be valued correctly today. Add in items that get re-polished, repaired, or partially sold as scrap, and a simple quantity count isn't enough.",
      },
      { type: "heading", text: "Habits that actually help" },
      {
        type: "list",
        items: [
          "Record every purchase the same day it happens, against the supplier it came from.",
          "Update stock immediately when an item is sold, not at the end of the week.",
          "Keep raw material (bars, old jewellery for melting) tracked separately from finished items.",
          "Reconcile physical stock against records on a fixed schedule, not only when something feels off.",
        ],
      },
      { type: "heading", text: "Where inventory software actually helps" },
      {
        type: "paragraph",
        text: "The habits above work better when the system does the recalculation for you. A proper jewellery ERP updates stock automatically the moment a sale or purchase is recorded, and values everything against the day's live gold, silver and diamond rates — so you're not manually redoing valuations every time rates move. That's the difference between 'stock management' as a task you do at day's end, and stock that's simply always correct.",
      },
      {
        type: "paragraph",
        text: "RatnSetu's inventory module was built around exactly this — every item and raw material tracked against live rates, updated automatically with every purchase and sale, so 'what's actually in stock right now' is always a quick answer, not a research project.",
      },
    ],
  },
  {
    slug: "why-jewellery-shops-need-inventory-management-software",
    title: "Why Jewellery Shops Need Inventory Management Software",
    category: "Inventory",
    coverIcon: "toll",
    publishedDate: "2026-08-05",
    readingTime: 4,
    shortDescription:
      "The real cost of running jewellery inventory on registers and spreadsheets — and what changes with dedicated software.",
    seo: {
      title: "Why Jewellery Shops Need Inventory Management Software | RatnSetu",
      metaDescription:
        "A practical look at why register-based stock tracking breaks down for jewellery retailers, and what jewellery inventory management software actually fixes.",
      primaryKeyword: "jewellery inventory management software",
      secondaryKeywords: ["jewellery ERP software", "jewellery business software India"],
    },
    content: [
      {
        type: "paragraph",
        text: "Most jewellery shops don't start out looking for software. Registers have worked for years, staff know the process, and switching systems feels like unnecessary effort. The need usually shows up quietly — a stock count that doesn't match, a customer dispute over an old purchase, or a slow afternoon spent tallying numbers that should have taken minutes.",
      },
      { type: "heading", text: "What register-based tracking actually costs" },
      {
        type: "list",
        items: [
          "Time — recalculating valuations by hand every time gold or silver rates change.",
          "Accuracy — handwritten entries and manual addition are easy places for small errors to creep in.",
          "Visibility — knowing today's exact stock position usually means asking someone or checking multiple books.",
          "Continuity — if the one person who understands the register system is unavailable, work slows down.",
        ],
      },
      { type: "heading", text: "What dedicated software changes" },
      {
        type: "paragraph",
        text: "Jewellery inventory management software doesn't just move the register onto a screen — it removes the manual recalculation entirely. Stock updates the moment a sale or purchase happens, valuations follow live rates automatically, and any staff member with access can see the same, current numbers instead of relying on one person's notebook.",
      },
      {
        type: "paragraph",
        text: "This matters more for jewellery than most retail categories, precisely because the value of what's on the shelf changes daily even if nothing is bought or sold. Software that understands this — rather than a generic retail POS bolted onto a jewellery shop — is what actually closes the gap between 'what we think we have' and 'what we actually have'.",
      },
    ],
  },
  {
    slug: "track-udhaar-outstanding-payments-jewellery-business",
    title: "How to Track Udhaar and Outstanding Payments in a Jewellery Business",
    category: "Customers",
    coverIcon: "account_balance_wallet",
    publishedDate: "2026-08-09",
    readingTime: 5,
    shortDescription:
      "Udhaar is common in jewellery retail — here's how to keep it organized instead of scattered across notebooks.",
    seo: {
      title: "How to Track Udhaar and Outstanding Payments in a Jewellery Business | RatnSetu",
      metaDescription:
        "Practical ways Indian jewellery retailers can track Udhaar and outstanding customer payments clearly, without relying on scattered notebooks.",
      primaryKeyword: "jewellery billing software",
      secondaryKeywords: ["jewellery business software India", "jewellery shop management software"],
    },
    content: [
      {
        type: "paragraph",
        text: "Udhaar is a normal part of jewellery retail in India — long-standing customers, festival-season purchases, or partial payments against a bigger order. It's a relationship built on trust. But trust doesn't scale well when the record of who owes what lives in a notebook that only one person can read.",
      },
      { type: "heading", text: "Common problems with notebook-based Udhaar tracking" },
      {
        type: "list",
        items: [
          "Different staff note down dues in different places, or don't note them at all.",
          "Old entries get missed or forgotten when a notebook fills up and a new one starts.",
          "There's no easy way to see a customer's total outstanding across multiple purchases at a glance.",
          "Partial payments against a due amount are easy to lose track of over time.",
        ],
      },
      { type: "heading", text: "What a proper Udhaar system should give you" },
      {
        type: "paragraph",
        text: "At minimum, you should be able to pull up any customer and immediately see their full purchase history alongside exactly what they currently owe — not reconstruct it from memory or multiple sources. Every payment, partial or full, should update that customer's outstanding balance automatically.",
      },
      {
        type: "paragraph",
        text: "This is exactly what RatnSetu's customer and Udhaar tracking is built for — one ledger per customer, updated with every sale and every payment, so 'who owes what, and since when' is a lookup, not a reconstruction project.",
      },
    ],
  },
  {
    slug: "jewellery-shop-management-registers-to-digital-erp",
    title: "Jewellery Shop Management: From Register Books to Digital ERP",
    category: "Business",
    coverIcon: "auto_stories",
    publishedDate: "2026-08-13",
    readingTime: 6,
    shortDescription:
      "What actually changes when a jewellery shop moves from paper registers to a digital ERP system.",
    seo: {
      title: "Jewellery Shop Management: From Register Books to Digital ERP | RatnSetu",
      metaDescription:
        "What changes, realistically, when an Indian jewellery shop moves from paper registers to a digital jewellery ERP — and what stays the same.",
      primaryKeyword: "jewellery ERP India",
      secondaryKeywords: ["jewellery shop management software", "jewellery business management software"],
    },
    content: [
      {
        type: "paragraph",
        text: "Every jewellery shop that has been around for years has its own register system — often more than one book, refined over time by whoever manages the shop. It works, in the sense that the business runs. The question worth asking isn't whether registers work, but how much time and risk they quietly carry.",
      },
      { type: "heading", text: "What stays the same" },
      {
        type: "paragraph",
        text: "Moving to a digital ERP doesn't change how you run your business — you still buy from suppliers, sell to customers, extend Udhaar to regulars, and manage staff. An ERP is built around these same jewellery-specific realities, not a generic retail workflow you have to adapt to.",
      },
      { type: "heading", text: "What actually changes" },
      {
        type: "list",
        items: [
          "Stock, sales and customer records live in one place instead of several registers.",
          "Valuations update automatically with live gold/silver rates instead of manual recalculation.",
          "Any authorized staff member sees the same, current numbers — not just whoever holds the register.",
          "GST-compliant invoices are generated directly from the sale, instead of prepared separately.",
        ],
      },
      { type: "heading", text: "A realistic way to think about the switch" },
      {
        type: "paragraph",
        text: "You don't need to digitize everything on day one. Most shops start with inventory and billing, then bring in customer/Udhaar tracking and staff accounts as the daily habit builds. The goal isn't to replace how your business works — it's to stop losing time and accuracy to the tools you're currently using to run it.",
      },
    ],
  },
  {
    slug: "jewellery-erp-software-improve-stock-management",
    title: "How Jewellery ERP Software Helps Improve Stock Management",
    category: "Inventory",
    coverIcon: "warehouse",
    publishedDate: "2026-08-18",
    readingTime: 5,
    shortDescription:
      "The specific ways ERP software improves stock accuracy for a jewellery business, beyond just 'digitizing' records.",
    seo: {
      title: "How Jewellery ERP Software Helps Improve Stock Management | RatnSetu",
      metaDescription:
        "A closer look at how jewellery ERP software improves stock accuracy — live rate valuation, purchase-to-stock sync, and real-time visibility.",
      primaryKeyword: "jewellery stock management software",
      secondaryKeywords: ["jewellery ERP software", "jewellery inventory management software"],
    },
    content: [
      {
        type: "paragraph",
        text: "'Digitizing' stock records is often misunderstood as simply typing the register into a spreadsheet. That helps with searching, but it doesn't fix the underlying problem — spreadsheets still need someone to manually update them correctly, every time, for every transaction.",
      },
      { type: "heading", text: "Where ERP software goes further than a spreadsheet" },
      {
        type: "list",
        items: [
          "Purchases and sales update stock automatically — no separate manual entry step to forget.",
          "Gold, silver and diamond valuations are computed from live rates, not last-updated numbers.",
          "Raw material and finished stock are tracked as distinct categories, not mixed together.",
          "Every stock change has a record of when and against which transaction it happened.",
        ],
      },
      { type: "heading", text: "The compounding effect" },
      {
        type: "paragraph",
        text: "Each of these on its own saves a little time. Together, they remove most of the manual reconciliation work that causes stock discrepancies in the first place — because the numbers were never manually re-entered anywhere to begin with. That's the real value of ERP software for stock management: fewer places where a small mistake can enter the record.",
      },
    ],
  },
  {
    slug: "manage-customer-purchase-history-jewellery-shop",
    title: "How to Manage Customer Purchase History in a Jewellery Shop",
    category: "Customers",
    coverIcon: "group",
    publishedDate: "2026-08-22",
    readingTime: 4,
    shortDescription:
      "Why customer purchase history matters more in jewellery retail than most categories, and how to keep it usable.",
    seo: {
      title: "How to Manage Customer Purchase History in a Jewellery Shop | RatnSetu",
      metaDescription:
        "Why a clear, searchable customer purchase history matters for jewellery retailers, and practical ways to maintain one.",
      primaryKeyword: "jewellery shop management software",
      secondaryKeywords: ["jewellery business software India", "jewellery billing software"],
    },
    content: [
      {
        type: "paragraph",
        text: "Jewellery purchases are often long-term relationships, not one-off transactions — the same family may buy across weddings, festivals and anniversaries over many years. Knowing that history well is a genuine business advantage, but only if it's actually retrievable when you need it.",
      },
      { type: "heading", text: "Why this is harder than it sounds" },
      {
        type: "paragraph",
        text: "If purchase records are split across old bill copies, memory, and whichever staff member served the customer last time, retrieving a clear history takes real effort — and often doesn't happen, so the advantage is lost.",
      },
      { type: "heading", text: "What a good customer record should support" },
      {
        type: "list",
        items: [
          "Look up a customer and see every past purchase, not just the most recent one.",
          "See current outstanding dues alongside purchase history, not in a separate place.",
          "Find a customer quickly by name or contact number, without needing an exact bill number.",
        ],
      },
      {
        type: "paragraph",
        text: "This is one of the more overlooked benefits of moving customer records into a proper system — not just record-keeping for its own sake, but being able to actually use that history in every conversation with a returning customer.",
      },
    ],
  },
  {
    slug: "gold-rate-management-jewellery-businesses",
    title: "Gold Rate Management for Jewellery Businesses",
    category: "Operations",
    coverIcon: "monitoring",
    publishedDate: "2026-08-27",
    readingTime: 5,
    shortDescription:
      "How jewellery businesses can keep pricing accurate as gold and silver rates move throughout the day.",
    seo: {
      title: "Gold Rate Management for Jewellery Businesses | RatnSetu",
      metaDescription:
        "How Indian jewellery retailers can manage daily gold and silver rate updates without manually repricing stock by hand.",
      primaryKeyword: "jewellery ERP software",
      secondaryKeywords: ["jewellery billing software", "jewellery stock management software"],
    },
    content: [
      {
        type: "paragraph",
        text: "Gold and silver rates change daily — sometimes more than once a day. For a jewellery business, this isn't background noise; it directly affects how every item in stock should be valued and billed. Getting this wrong, even slightly, adds up across hundreds of transactions.",
      },
      { type: "heading", text: "The manual approach and its limits" },
      {
        type: "paragraph",
        text: "Many shops update a single day's rate each morning and apply it manually through the day — workable, but it means someone has to remember to update it, communicate it to every staff member billing customers, and recompute valuations for existing stock by hand.",
      },
      { type: "heading", text: "What rate management should look like in software" },
      {
        type: "list",
        items: [
          "One place to set the day's rate, reflected instantly everywhere it's used — billing, stock valuation, reports.",
          "Automatic derivation of different purities (22K, 18K, etc.) from a single entered rate, instead of separate manual entries.",
          "A history of past rates, so historical stock valuations and past invoices stay consistent.",
        ],
      },
      {
        type: "paragraph",
        text: "RatnSetu handles this by letting you enter the 24K gold rate once — every other purity is derived automatically, and it flows straight into billing and stock valuation without a separate update step.",
      },
    ],
  },
  {
    slug: "small-jewellery-shops-digitize-daily-operations",
    title: "How Small Jewellery Shops Can Digitize Their Daily Operations",
    category: "Business",
    coverIcon: "storefront",
    publishedDate: "2026-09-01",
    readingTime: 5,
    shortDescription:
      "A realistic, low-friction starting point for small jewellery shops considering digital tools for the first time.",
    seo: {
      title: "How Small Jewellery Shops Can Digitize Their Daily Operations | RatnSetu",
      metaDescription:
        "A realistic starting point for small Indian jewellery shops looking to digitize inventory, billing and customer records without disrupting daily work.",
      primaryKeyword: "jewellery business software India",
      secondaryKeywords: ["jewellery shop management software", "jewellery ERP software"],
    },
    content: [
      {
        type: "paragraph",
        text: "Digitizing a small jewellery shop's operations can feel like a big project — new software, new habits, and worry about disrupting a business that already works. In practice, it doesn't need to happen all at once.",
      },
      { type: "heading", text: "A practical starting order" },
      {
        type: "list",
        items: [
          "Start with inventory — get your current stock into the system first, since everything else depends on it being accurate.",
          "Move billing next — generate invoices directly from the system so sales and stock stay in sync automatically.",
          "Add customer and Udhaar tracking once billing is a daily habit.",
          "Bring in staff accounts and reports last, once the core data is reliable.",
        ],
      },
      { type: "heading", text: "What to expect in the first few weeks" },
      {
        type: "paragraph",
        text: "There's usually a short adjustment period where entering data feels slower than the old register — that's normal. It evens out once the habit forms, and the payoff (accurate stock, faster billing, retrievable customer history) starts showing within the first month for most shops.",
      },
    ],
  },
  {
    slug: "jewellery-business-management-software-complete-guide",
    title: "Jewellery Business Management Software: A Complete Guide for Retailers",
    category: "Business",
    coverIcon: "menu_book",
    publishedDate: "2026-09-06",
    readingTime: 7,
    shortDescription:
      "An overview of what jewellery business management software actually covers, for retailers evaluating one for the first time.",
    seo: {
      title: "Jewellery Business Management Software: A Complete Guide for Retailers | RatnSetu",
      metaDescription:
        "A complete, practical overview of what jewellery business management software covers — inventory, billing, customers, Udhaar, staff and reports.",
      primaryKeyword: "jewellery business management software",
      secondaryKeywords: ["jewellery ERP software", "jewellery ERP India"],
    },
    content: [
      {
        type: "paragraph",
        text: "If you're evaluating software for your jewellery business for the first time, it helps to know what a complete system should actually cover — not every product marketed as 'jewellery software' covers all of it.",
      },
      { type: "heading", text: "The core areas to look for" },
      {
        type: "list",
        items: [
          "Inventory — tracking finished jewellery and raw material against live metal rates.",
          "Purchases — recording supplier purchases with stock updated automatically.",
          "Sales & billing — GST-compliant invoices generated directly from a sale.",
          "Customers — purchase history and contact details, searchable per customer.",
          "Udhaar/outstanding — a clear ledger of dues per customer, not a separate notebook.",
          "Suppliers — purchase history organized by supplier.",
          "Reports — a real-time view of stock, sales and dues.",
          "Multi-user access — staff accounts with role-based, admin-controlled permissions.",
        ],
      },
      { type: "heading", text: "Questions worth asking before choosing one" },
      {
        type: "list",
        items: [
          "Does it handle gold/silver/diamond rate changes automatically, or require manual repricing?",
          "Can multiple staff use it at once without losing track of who did what?",
          "Is customer purchase history actually searchable, not just stored?",
          "Does it work from both a shop computer and a phone, if that matters to your business?",
        ],
      },
      {
        type: "paragraph",
        text: "RatnSetu was built to cover this full list specifically for jewellery retailers — not adapted from a generic retail template — with web and mobile access so it fits how a jewellery shop actually operates day to day.",
      },
    ],
  },
  {
    slug: "inventory-sales-customer-management-one-system",
    title: "Inventory, Sales and Customer Management: One System for Your Jewellery Shop",
    category: "Business",
    coverIcon: "hub",
    publishedDate: "2026-09-11",
    readingTime: 5,
    shortDescription:
      "Why keeping inventory, sales and customer data in one connected system matters more than having each tracked well separately.",
    seo: {
      title: "Inventory, Sales and Customer Management: One System | RatnSetu",
      metaDescription:
        "Why connecting inventory, sales and customer management in one system matters more for jewellery retailers than tracking each well separately.",
      primaryKeyword: "jewellery ERP software",
      secondaryKeywords: ["jewellery business management software", "jewellery shop management software"],
    },
    content: [
      {
        type: "paragraph",
        text: "It's possible to track inventory reasonably well in one spreadsheet, sales in another, and customers in a third — and still end up with a business that's hard to see clearly, because none of them talk to each other.",
      },
      { type: "heading", text: "The problem with separate systems" },
      {
        type: "paragraph",
        text: "When a sale happens, it should reduce stock and update the customer's purchase history automatically. If these live in separate places, someone has to manually update each one — and manual, repeated updates are exactly where records start drifting apart from reality.",
      },
      { type: "heading", text: "What 'one system' actually means in practice" },
      {
        type: "list",
        items: [
          "A sale reduces stock and logs against the customer, in the same action.",
          "A purchase increases stock and logs against the supplier, in the same action.",
          "Reports reflect all of this in real time, without a separate reconciliation step.",
        ],
      },
      {
        type: "paragraph",
        text: "This connectedness is really the core idea behind an ERP, as opposed to several separate tools — and it's why RatnSetu is built as one system rather than separate modules that happen to share a login screen.",
      },
    ],
  },
];

export function getBlogBySlug(slug) {
  return BLOGS.find((b) => b.slug === slug);
}

export function getRelatedBlogs(slug, count = 3) {
  const current = getBlogBySlug(slug);
  if (!current) return BLOGS.slice(0, count);
  return BLOGS.filter((b) => b.slug !== slug && b.category === current.category).slice(0, count).length
    ? BLOGS.filter((b) => b.slug !== slug && b.category === current.category).slice(0, count)
    : BLOGS.filter((b) => b.slug !== slug).slice(0, count);
}
