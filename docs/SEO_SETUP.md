# SEO Setup Guide (Google Search Console + GA4)

This document is for whoever owns the `ratnsetu.com` domain and Google
accounts -- it covers the manual steps the code cannot do for you. Nothing
here can be automated from the codebase: Google requires a human to prove
domain ownership and to submit things through its own dashboards.

## What the code already does

- `Seo` component (`src/components/marketing/Seo.jsx`) sets a unique
  title/description/canonical/OG/Twitter tag and JSON-LD structured data on
  every page.
- `public/sitemap.xml` is regenerated automatically before every
  `npm run build` (via `scripts/generate-sitemap.js`, wired as the
  `prebuild` npm script) from the real route list and `src/data/blogs.js`.
  You never need to hand-edit it.
- `public/robots.txt` allows all public marketing/blog pages and disallows
  the authenticated app routes (`/dashboard`, `/sales`, etc.) and `/subscribe`.
- GA4 (`src/utils/analytics.js`) is fully wired but does **nothing** unless
  `VITE_GA_MEASUREMENT_ID` is set at build time -- see step 1.

## 1. Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com) and create a
   GA4 property for `ratnsetu.com` (Admin > Create Property).
2. Create a **Web** data stream for `https://www.ratnsetu.com`. Google gives
   you a Measurement ID shaped like `G-XXXXXXXXXX`.
3. Set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in
   `Frontend-gem/GemControl/.env.production` (or your hosting platform's
   environment variable settings, e.g. Vercel/Render project settings) and
   redeploy.
4. That's it in code terms -- `analytics.js` picks it up automatically. If
   the variable is left blank, the site runs identically with analytics
   fully disabled (no errors, no script loaded).
5. Events already wired: `page_view` (every route change), `get_started_click`,
   `book_demo_click`, `login_click`, `pricing_view`, `contact_form_start`,
   `contact_form_submit`, `blog_view`, `blog_cta_click`, `feature_cta_click`.
   None of these send personal data (no names, emails, phone numbers, or
   message content) -- only page paths, button locations, plan keys, and
   blog slugs/categories.

## 2. Google Search Console -- Domain Verification

Use the **Domain property** type (covers `http://`, `https://`, `www` and
non-`www` all at once), not a URL-prefix property.

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add property > **Domain** > enter `ratnsetu.com`.
3. Google will ask you to add a **DNS TXT record** at your domain registrar
   (this is the standard method for a Domain property). Add it, wait for DNS
   to propagate (can take a few minutes to a few hours), then click Verify.
4. Alternative if you can't access DNS settings: use a **URL-prefix**
   property with the **HTML tag** method instead --
   - Search Console gives you a `<meta name="google-site-verification"
     content="...">` tag.
   - Open `Frontend-gem/GemControl/index.html`, find the commented-out
     example near the top of `<head>`, uncomment it, and paste your real
     token into `content="..."`.
   - Rebuild and deploy, then click Verify in Search Console.
   - Do not invent or reuse a token from another project -- it must be the
     exact one Search Console shows you for `ratnsetu.com`.

## 3. Submit the Sitemap

Once verified:

1. In Search Console, go to **Indexing > Sitemaps**.
2. Enter `sitemap.xml` (resolves to `https://www.ratnsetu.com/sitemap.xml`)
   and click Submit.
3. Confirm it returns "Success" with the URL count matching your public
   pages (9 static pages + however many blog posts exist).

## 4. URL Inspection & Requesting Indexing

For key pages you want indexed quickly after launch (Home, Features,
Pricing, and each blog post):

1. Search Console > **URL Inspection**, paste the full URL.
2. If it says "URL is not on Google," click **Request Indexing**. This
   queues a crawl -- it is not instant and Google does not guarantee it.
3. Repeat for a handful of priority pages after each major content update;
   don't do this for every page on every change, it's meant for genuinely
   new/changed content.

## 5. Ongoing Monitoring

- **Performance report** (Search Console > Performance): tracks impressions,
  clicks, average position, and CTR per query/page over time. Check weekly
  once live; expect little data for the first 1-2 weeks.
- **Core Web Vitals** (Search Console > Experience > Core Web Vitals, or
  [PageSpeed Insights](https://pagespeed.web.dev) for on-demand checks):
  monitors LCP/INP/CLS using real Chrome user data once enough traffic
  exists. Until then, use PageSpeed Insights' lab data.
- **Index Coverage** (Search Console > Indexing > Pages): shows which pages
  are indexed vs. excluded and why (e.g. "Discovered, not indexed" is
  normal for a brand-new site and usually resolves as the site gains a few
  inbound links/authority).
- **Search queries**: found in the same Performance report -- this is how
  you discover which real jewellery-ERP-related searches are already
  surfacing the site, which should inform future blog topics.

## What this codebase cannot do for you

- It cannot submit the sitemap to Google automatically -- step 3 above is
  always a manual action in the Search Console UI.
- It cannot verify domain ownership for you -- that requires proving you
  control the domain/DNS or hosting.
- It cannot guarantee indexing or ranking for any keyword.
