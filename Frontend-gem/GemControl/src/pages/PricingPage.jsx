import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import PricingCard from "../components/marketing/PricingCard";
import CTASection from "../components/marketing/CTASection";
import Seo from "../components/marketing/Seo";
import { PRICING_PLANS } from "../data/pricing";
import { SITE_CONFIG, PAGE_SEO } from "../data/siteConfig";
import { trackEvent } from "../utils/analytics";

function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_CONFIG.productName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android",
    description: "Jewellery business management ERP for jewellery retailers.",
    offers: PRICING_PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price,
      priceCurrency: "INR",
    })),
  };
}

function PricingPage() {
  const theme = useTheme();

  useEffect(() => {
    trackEvent("pricing_view");
  }, []);

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo
        title={PAGE_SEO.pricing.title}
        description={PAGE_SEO.pricing.description}
        path={PAGE_SEO.pricing.path}
        structuredData={softwareApplicationSchema()}
      />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center", mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            Simple Pricing for Your Jewellery Business
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "1.05rem" }}>
            Billed monthly. Start with a 14-day free trial — no card required. Cancel anytime.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 3,
            maxWidth: 760,
            mx: "auto",
            mb: 6,
          }}
        >
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.key} plan={plan} />
          ))}
        </Box>

        <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary }}>
            Have questions about which plan fits your shop? Write to us at{" "}
            <Box component="a" href={`mailto:${SITE_CONFIG.supportEmail}`} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              {SITE_CONFIG.supportEmail}
            </Box>
            .
          </Typography>
        </Box>
      </Box>

      <CTASection context="pricing" />
      </main>
      <MarketingFooter />
    </Box>
  );
}

export default PricingPage;
