import { Box, Typography, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import CTASection from "../components/marketing/CTASection";
import Seo from "../components/marketing/Seo";
import SymbolIcon from "../components/SymbolIcon";
import { FEATURES } from "../data/features";
import { ROUTES } from "../utils/routes";
import { PAGE_SEO } from "../data/siteConfig";

function FeaturesPage() {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo title={PAGE_SEO.features.title} description={PAGE_SEO.features.description} path={PAGE_SEO.features.path} />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center", mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            Everything Your Jewellery Business Needs
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "1.05rem" }}>
            A jewellery business management ERP, not a simple billing app — covering inventory,
            purchases, sales, customers, Udhaar, suppliers, reports and staff management.
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 1100, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          {FEATURES.map((feature) => (
            <Paper
              key={feature.title}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                display: "flex",
                gap: 3,
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: theme.palette.mode === "light" ? "rgba(162, 137, 95, 0.12)" : "rgba(224, 194, 152, 0.14)",
                }}
              >
                <SymbolIcon name={feature.icon} size={30} sx={{ color: theme.palette.tertiary.main }} />
              </Box>
              <Box>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 0.75 }}>
                  {feature.title}
                </Typography>
                <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                  {feature.detail}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        <Typography sx={{ maxWidth: 1100, mx: "auto", mt: 5, textAlign: "center", color: theme.palette.text.secondary }}>
          See how these features fit into{" "}
          <Box component={RouterLink} to={ROUTES.PRICING} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            RatnSetu's pricing plans
          </Box>
          .
        </Typography>
      </Box>

      <CTASection context="features" />
      </main>
      <MarketingFooter />
    </Box>
  );
}

export default FeaturesPage;
