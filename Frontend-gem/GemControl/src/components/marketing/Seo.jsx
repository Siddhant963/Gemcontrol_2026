import { Helmet } from "react-helmet-async";
import { SITE_CONFIG } from "../../data/siteConfig";

// Always-present base schema (Organization + WebSite). Deliberately omits
// address/phone/founding year/social profiles/logo details that aren't
// verified anywhere in the project -- only fields backed by real data
// (name, url, support email, the real ADRS Techno relationship) are
// included. See docs/SEO_AUDIT_REPORT.md for what's intentionally left out.
function buildBaseSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_CONFIG.productName,
      url: SITE_CONFIG.siteUrl,
      logo: `${SITE_CONFIG.siteUrl}/ratnsetu-logo.png`,
      email: SITE_CONFIG.supportEmail,
      parentOrganization: {
        "@type": "Organization",
        name: SITE_CONFIG.legalCompanyName,
        url: SITE_CONFIG.legalCompanyUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_CONFIG.productName,
      url: SITE_CONFIG.siteUrl,
    },
  ];
}

/**
 * Per-route <head> tags: title, description, canonical, robots, Open Graph,
 * Twitter Card, and JSON-LD structured data (Organization+WebSite always,
 * plus whatever the page passes via `structuredData`).
 *
 * This is a client-rendered SPA (no SSR/SSG) -- these tags apply once the JS
 * bundle runs. Good enough for modern crawlers that execute JS, but a
 * verification/scraping tool that only reads raw HTML (e.g. Google Search
 * Console's site-verification fetch) won't see them -- that's why Google
 * Search Console verification is done via a static tag in index.html
 * instead, not through this component (see docs/SEO_SETUP.md).
 */
function Seo({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  structuredData,
  article, // { publishedTime, modifiedTime, author }
}) {
  const url = `${SITE_CONFIG.siteUrl}${path}`;
  const ogImage = image || `${SITE_CONFIG.siteUrl}/ratnsetu-logo.png`;
  const schemaList = [...buildBaseSchema(), ...(Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [])];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_CONFIG.productName} />
      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
      {article?.author && <meta property="article:author" content={article.author} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schemaList.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export default Seo;
