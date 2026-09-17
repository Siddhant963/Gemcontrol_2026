import { useEffect } from "react";
import { Box, Typography, Chip, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useParams, Navigate, Link as RouterLink } from "react-router-dom";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import BlogCard from "../components/marketing/BlogCard";
import CTASection from "../components/marketing/CTASection";
import Seo from "../components/marketing/Seo";
import Breadcrumbs, { breadcrumbSchema } from "../components/marketing/Breadcrumbs";
import SymbolIcon from "../components/SymbolIcon";
import { getBlogBySlug, getRelatedBlogs } from "../data/blogs";
import { ROUTES } from "../utils/routes";
import { SITE_CONFIG } from "../data/siteConfig";
import { trackEvent } from "../utils/analytics";

// Maps a blog's category to the most relevant Features-page section, so the
// "naturally link to the relevant feature" internal-linking requirement has
// real, descriptive anchor text instead of a generic "Features" link. There
// isn't a separate URL per feature (single Features page), so all of these
// point at /features -- the anchor text still varies to fit each article.
const CATEGORY_FEATURE_LABEL = {
  Inventory: "Jewellery Inventory Management",
  Customers: "Customer & Udhaar Management",
  Business: "Jewellery Business Management",
  Operations: "Gold Rate Management",
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function ContentBlock({ block, theme }) {
  if (block.type === "heading") {
    return (
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 4, mb: 1.5 }}>
        {block.text}
      </Typography>
    );
  }
  if (block.type === "list") {
    return (
      <Box component="ul" sx={{ pl: 3, mb: 2, color: theme.palette.text.secondary }}>
        {block.items.map((item) => (
          <Box component="li" key={item} sx={{ mb: 1, lineHeight: 1.7 }}>
            {item}
          </Box>
        ))}
      </Box>
    );
  }
  return (
    <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mb: 2, fontSize: "1.02rem" }}>
      {block.text}
    </Typography>
  );
}

function BlogDetailPage() {
  const theme = useTheme();
  const { slug } = useParams();
  const blog = getBlogBySlug(slug);

  useEffect(() => {
    if (blog) {
      trackEvent("blog_view", { slug: blog.slug, category: blog.category });
    }
  }, [blog]);

  if (!blog) {
    return <Navigate to={ROUTES.BLOGS} replace />;
  }

  const related = getRelatedBlogs(slug);
  const breadcrumbItems = [
    { label: "Home", to: ROUTES.LANDING },
    { label: "Blogs", to: ROUTES.BLOGS },
    { label: blog.title },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.shortDescription,
    image: `${SITE_CONFIG.siteUrl}/ratnsetu-logo.png`,
    datePublished: blog.publishedDate,
    dateModified: blog.modifiedDate || blog.publishedDate,
    author: { "@type": "Organization", name: SITE_CONFIG.productName },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.productName,
      logo: { "@type": "ImageObject", url: `${SITE_CONFIG.siteUrl}/ratnsetu-logo.png` },
    },
    mainEntityOfPage: `${SITE_CONFIG.siteUrl}${ROUTES.BLOGS}/${blog.slug}`,
  };

  const featureLabel = CATEGORY_FEATURE_LABEL[blog.category] || "jewellery ERP features";

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo
        title={blog.seo.title}
        description={blog.seo.metaDescription}
        path={`${ROUTES.BLOGS}/${blog.slug}`}
        type="article"
        structuredData={[articleSchema, breadcrumbSchema(breadcrumbItems)]}
        article={{ publishedTime: blog.publishedDate, modifiedTime: blog.modifiedDate || blog.publishedDate }}
      />
      <MarketingHeader />
      <main>
      <Breadcrumbs items={breadcrumbItems} />

      <Box
        sx={{
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mt: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <SymbolIcon name={blog.coverIcon} size={64} sx={{ color: theme.palette.tertiary.fixed }} />
      </Box>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 5, sm: 6 } }} component="article">
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
          <Chip label={blog.category} size="small" sx={{ mb: 2, bgcolor: theme.palette.surfaces.container }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "1.7rem", sm: "2.25rem" }, mb: 2, lineHeight: 1.3 }}>
            {blog.title}
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 4 }}>
            By {SITE_CONFIG.productName} Team · {formatDate(blog.publishedDate)} · {blog.readingTime} min read
          </Typography>

          <Divider sx={{ mb: 4 }} />

          {blog.content.map((block, i) => (
            <ContentBlock key={i} block={block} theme={theme} />
          ))}

          <Divider sx={{ my: 4 }} />

          <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8 }}>
            See how {SITE_CONFIG.productName}'s{" "}
            <Box component={RouterLink} to={ROUTES.FEATURES} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              {featureLabel}
            </Box>{" "}
            works, or check{" "}
            <Box component={RouterLink} to={ROUTES.PRICING} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              RatnSetu pricing
            </Box>{" "}
            to get started.
          </Typography>
        </Box>
      </Box>

      {related.length > 0 && (
        <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, pb: { xs: 6, sm: 8 } }} component="aside">
          <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
              Related Articles
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: 3,
              }}
            >
              {related.map((b) => (
                <BlogCard key={b.slug} blog={b} />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <CTASection
        title="Bring your jewellery business into one smart system"
        subtitle="Start your 14-day free trial — no card required."
        context="blog"
      />
      </main>
      <MarketingFooter />
    </Box>
  );
}

export default BlogDetailPage;
