import { Box, Typography, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MarketingHeader from "../components/marketing/MarketingHeader";
import { Link as RouterLink } from "react-router-dom";
import MarketingFooter from "../components/marketing/MarketingFooter";
import CTASection from "../components/marketing/CTASection";
import Seo from "../components/marketing/Seo";
import SymbolIcon from "../components/SymbolIcon";
import { ROUTES } from "../utils/routes";
import { PAGE_SEO } from "../data/siteConfig";

const PILLARS = [
  {
    icon: "diamond",
    title: "Jewellery-focused, not generic retail",
    description:
      "RatnSetu is built around how jewellery businesses actually operate — gold/silver/diamond rate-driven valuations, Udhaar, and pledge management — not adapted from a generic retail template.",
  },
  {
    icon: "insights",
    title: "Technology-driven business management",
    description:
      "Inventory, billing, customers and reports connected in one system, so records stay consistent without manual reconciliation between separate tools.",
  },
  {
    icon: "handshake",
    title: "Built for the way jewellery businesses actually work",
    description:
      "Udhaar, supplier relationships, and staff handling day-to-day records are treated as normal parts of the business, not edge cases to work around.",
  },
];

function AboutPage() {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo title={PAGE_SEO.about.title} description={PAGE_SEO.about.description} path={PAGE_SEO.about.path} />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 800, mx: "auto", textAlign: "center", mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            Built for the Way Jewellery Businesses Work
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "1.05rem", lineHeight: 1.7 }}>
            RatnSetu is a complete jewellery business management ERP, built specifically for
            Indian jewellery retailers — not a generic billing tool adapted for the trade.
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 760, mx: "auto", mb: 8 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Why RatnSetu was created
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mb: 3 }}>
            Jewellery retailers deal with problems most retail software doesn't account for —
            stock that revalues with gold and silver rates every day, Udhaar extended to
            long-standing customers, pledge (Girvi) loans with accruing interest, and multiple
            staff members handling records across a busy shop floor. Most of this ends up spread
            across registers, spreadsheets, and memory.
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mb: 3 }}>
            RatnSetu was created to bring inventory, purchases, sales, customers, Udhaar and
            reporting into one connected system — designed around jewellery-specific realities
            from the ground up, rather than added on as an afterthought.
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, fontWeight: 600, fontStyle: "italic" }}>
            Built for the way jewellery businesses actually work.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            maxWidth: 1100,
            mx: "auto",
          }}
        >
          {PILLARS.map((pillar) => (
            <Paper key={pillar.title} sx={{ p: 3, borderRadius: 3 }}>
              <SymbolIcon name={pillar.icon} size={32} sx={{ color: theme.palette.tertiary.main, mb: 2 }} />
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{pillar.title}</Typography>
              <Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary, lineHeight: 1.65 }}>
                {pillar.description}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Typography sx={{ maxWidth: 760, mx: "auto", mt: 6, textAlign: "center", color: theme.palette.text.secondary }}>
          See the full{" "}
          <Box component={RouterLink} to={ROUTES.FEATURES} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            jewellery ERP feature set
          </Box>{" "}
          or check{" "}
          <Box component={RouterLink} to={ROUTES.PRICING} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            RatnSetu pricing
          </Box>
          .
        </Typography>
      </Box>

      <CTASection context="about" />
      </main>
      <MarketingFooter />
    </Box>
  );
}

export default AboutPage;
