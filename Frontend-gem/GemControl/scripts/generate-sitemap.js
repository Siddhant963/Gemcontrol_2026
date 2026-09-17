// Generates public/sitemap.xml from the actual route list + blog data,
// instead of hand-maintaining a static XML file. Runs automatically before
// every build via package.json's "prebuild" script, so a new blog added to
// src/data/blogs.js appears in the sitemap on the next build with no
// manual edit needed. Deliberately excludes every authenticated app route
// (dashboard, users, sales, etc.) and auth pages -- only public, indexable
// marketing/blog URLs belong here.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { BLOGS } from "../src/data/blogs.js";
import { SITE_CONFIG } from "../src/data/siteConfig.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const today = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.7" },
  { path: "/features", priority: "0.9" },
  { path: "/pricing", priority: "0.9" },
  { path: "/testimonials", priority: "0.6" },
  { path: "/blogs", priority: "0.8" },
  { path: "/contact", priority: "0.7" },
  { path: "/privacy-policy", priority: "0.3" },
  { path: "/terms-and-conditions", priority: "0.3" },
];

const urls = [
  ...STATIC_PAGES.map((p) => ({ loc: `${SITE_CONFIG.siteUrl}${p.path}`, priority: p.priority, lastmod: today })),
  ...BLOGS.map((blog) => ({
    loc: `${SITE_CONFIG.siteUrl}/blogs/${blog.slug}`,
    priority: "0.6",
    lastmod: blog.modifiedDate || blog.publishedDate,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`)
  .join("\n")}
</urlset>
`;

const outPath = join(__dirname, "..", "public", "sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`sitemap.xml generated with ${urls.length} URLs -> ${outPath}`);
