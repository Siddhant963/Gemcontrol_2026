import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import BlogCard from "../components/marketing/BlogCard";
import Seo from "../components/marketing/Seo";
import { BLOGS } from "../data/blogs";
import { ROUTES } from "../utils/routes";
import { PAGE_SEO } from "../data/siteConfig";

function BlogListPage() {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo title={PAGE_SEO.blogs.title} description={PAGE_SEO.blogs.description} path={PAGE_SEO.blogs.path} />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center", mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            Insights for Modern Jewellery Businesses
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary }}>
            Practical articles on running a jewellery business, written for jewellery shop owners.
            See the full{" "}
            <Box component={RouterLink} to={ROUTES.FEATURES} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              jewellery ERP features
            </Box>{" "}
            or{" "}
            <Box component={RouterLink} to={ROUTES.PRICING} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              pricing
            </Box>
            .
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            maxWidth: 1200,
            mx: "auto",
          }}
        >
          {BLOGS.map((blog) => (
            <BlogCard key={blog.slug} blog={blog} />
          ))}
        </Box>
      </Box>

      </main>
      <MarketingFooter />
    </Box>
  );
}

export default BlogListPage;
