// Central place for facts that must never be invented per-page. Update
// these once verified/real values exist instead of hardcoding them again
// inside individual marketing pages.
export const SITE_CONFIG = {
  productName: "RatnSetu",
  tagline: "Jewellery Business Management ERP",
  legalCompanyName: "ADRS Techno Pvt. Ltd.",
  legalCompanyUrl: "https://www.adrstechno.com/",
  supportEmail: "support@ratnsetu.com",
  supportPhone: "+91 92013 47033",
  whatsappNumber: "+91 92013 47033",
  businessHours: "Mon–Sat, 10:00 AM – 7:00 PM IST",
  // ADRS Techno Pvt. Ltd.'s registered address (RatnSetu's developer/company).
  registeredAddress: "71, Dadda Nagar, Karmeta, Katangi Bypass, Jabalpur, Madhya Pradesh 482002, India",
  // Same address, broken into parts for schema.org PostalAddress structured
  // data (see Seo.jsx) -- keep in sync with registeredAddress above.
  registeredAddressParts: {
    streetAddress: "71, Dadda Nagar, Karmeta, Katangi Bypass",
    addressLocality: "Jabalpur",
    addressRegion: "Madhya Pradesh",
    postalCode: "482002",
    addressCountry: "IN",
  },
  siteUrl: "https://www.ratnsetu.com",
};

// Centralized per-page SEO copy (Seo component reads this indirectly via
// each page passing its own title/description -- kept here too so every
// page's copy is reviewable/editable in one place instead of hunting
// through page components). Keep title/description in sync with what each
// page actually passes to <Seo>.
export const PAGE_SEO = {
  home: {
    title: "RatnSetu | Jewellery ERP & Shop Management Software",
    description:
      "RatnSetu is a jewellery business management ERP for Indian jewellery retailers. Manage inventory, purchases, sales, customers, outstanding payments and daily business operations from one platform.",
    path: "/",
  },
  about: {
    title: "About RatnSetu | Jewellery Business Management ERP",
    description:
      "RatnSetu was built for the way Indian jewellery businesses actually work -- inventory, Udhaar, pledge management and staff handling, in one connected system.",
    path: "/about",
  },
  features: {
    title: "Jewellery ERP Features | RatnSetu",
    description:
      "Explore RatnSetu's jewellery ERP features: inventory, purchase, sales and customer management, Udhaar & outstanding tracking, suppliers, business reports, and multi-user access.",
    path: "/features",
  },
  pricing: {
    title: "RatnSetu Pricing | Jewellery ERP Software",
    description:
      "Simple, transparent monthly pricing for RatnSetu's jewellery business management ERP. Start with a 14-day free trial, no card required.",
    path: "/pricing",
  },
  testimonials: {
    title: "RatnSetu Testimonials | Jewellery Business Software",
    description: "What jewellery retailers say about managing their business with RatnSetu.",
    path: "/testimonials",
  },
  blogs: {
    title: "Jewellery Business Insights & ERP Guides | RatnSetu",
    description:
      "Practical articles for Indian jewellery retailers on inventory, billing, Udhaar, customer management and running a jewellery shop with less manual work.",
    path: "/blogs",
  },
  contact: {
    title: "Contact RatnSetu | Jewellery ERP Software",
    description:
      "Get in touch with the RatnSetu team to ask questions or request a demo of our jewellery business management ERP.",
    path: "/contact",
  },
  privacy: {
    title: "Privacy Policy | RatnSetu",
    description: "How RatnSetu collects, uses, and protects data for jewellery business management ERP customers.",
    path: "/privacy-policy",
  },
  terms: {
    title: "Terms & Conditions | RatnSetu",
    description: "Terms and conditions for using RatnSetu's jewellery business management ERP.",
    path: "/terms-and-conditions",
  },
};

// Optional analytics/verification IDs -- both undefined unless set in the
// deployment's env. Never invent placeholder-looking values here; leave
// blank so analytics.js and Seo.jsx can no-op cleanly when absent.
// import.meta.env only exists under Vite -- guarded so this file can also be
// imported by plain-Node build scripts (see scripts/generate-sitemap.js)
// without needing Vite's environment.
const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;

// Google Search Console verification is a separate, static <meta> tag in
// index.html (not read from env) -- GSC's verification fetch doesn't
// execute JS, so a value injected here at runtime wouldn't be seen. See the
// comment in index.html and docs/SEO_SETUP.md.
export const ANALYTICS_CONFIG = {
  gaMeasurementId: env?.VITE_GA_MEASUREMENT_ID || "",
};
