import { Box, Typography, Button, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import { SITE_CONFIG } from "../data/siteConfig";
import { FEATURES, PROBLEM_SOLUTION_ITEMS, HOW_IT_WORKS_STEPS } from "../data/features";
import { PRICING_PLANS } from "../data/pricing";
import { TESTIMONIALS } from "../data/testimonials";
import { BLOGS } from "../data/blogs";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import SectionHeading from "../components/marketing/SectionHeading";
import FeatureCard from "../components/marketing/FeatureCard";
import PricingCard from "../components/marketing/PricingCard";
import TestimonialCarousel from "../components/marketing/TestimonialCarousel";
import BlogCard from "../components/marketing/BlogCard";
import CTASection from "../components/marketing/CTASection";
import Seo from "../components/marketing/Seo";
import SymbolIcon from "../components/SymbolIcon";
import { trackEvent } from "../utils/analytics";

function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_CONFIG.productName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android",
    description:
      "Jewellery business management ERP for jewellery retailers -- inventory, purchases, sales, customers, Udhaar and outstanding payments.",
    url: SITE_CONFIG.siteUrl,
    offers: PRICING_PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price,
      priceCurrency: "INR",
      url: `${SITE_CONFIG.siteUrl}${ROUTES.PRICING}`,
    })),
  };
}

const PRODUCT_DETAIL_SECTIONS = [
  {
    icon: "inventory_2",
    title: "Inventory that values itself",
    description:
      "Every item and raw material is tracked against live gold, silver and diamond rates, so valuations stay correct as rates move — no manual recalculation.",
    stat: { label: "Rates applied", value: "Live" },
  },
  {
    icon: "receipt_long",
    title: "Billing that stays GST-compliant",
    description:
      "Generate accurate, tax-ready invoices in seconds, drawing directly from current stock and rates — sales, stock and accounts stay in sync automatically.",
    stat: { label: "GST breakdown", value: "Automatic" },
  },
  {
    icon: "account_balance_wallet",
    title: "Udhaar you can actually see",
    description:
      "One ledger per customer for outstanding dues — updated with every sale and payment, instead of scattered notebooks.",
    stat: { label: "Ledgers", value: "Per customer" },
  },
  {
    icon: "bar_chart",
    title: "Reports without the end-of-day tally",
    description:
      "See stock, sales and outstanding dues as they stand right now, instead of reconstructing them at closing time.",
    stat: { label: "Visibility", value: "Real-time" },
  },
];

function Section({ children, sx }) {
  return (
    <Box component="section" sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 }, ...sx }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
    </Box>
  );
}

function LandingPage() {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo
        title="RatnSetu | Jewellery ERP & Shop Management Software"
        description="RatnSetu is a jewellery business management ERP for Indian jewellery retailers. Manage inventory, purchases, sales, customers, outstanding payments and daily business operations from one platform."
        path="/"
        structuredData={softwareApplicationSchema()}
      />
      <MarketingHeader />
      <main>

      {/* Hero */}
      <Section sx={{ pt: { xs: 6, sm: 9 }, pb: { xs: 6, sm: 8 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            gap: { xs: 5, md: 6 },
            alignItems: "center",
          }}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: "2.1rem", sm: "2.75rem", md: "3.1rem" },
                lineHeight: 1.15,
                mb: 2.5,
              }}
            >
              The Smarter Way to Manage Your Jewellery Business
            </Typography>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: "1rem", sm: "1.1rem" },
                maxWidth: 560,
                mx: { xs: "auto", md: 0 },
                mb: 4,
                lineHeight: 1.65,
              }}
            >
              RatnSetu is a complete jewellery business management ERP designed to help jewellery
              retailers manage inventory, purchases, sales, customers, outstanding payments and
              daily operations from one powerful platform.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: { xs: "center", md: "flex-start" }, flexWrap: "wrap" }}>
              <Button
                component={RouterLink}
                to={ROUTES.REGISTER}
                onClick={() => trackEvent("get_started_click", { location: "hero" })}
                variant="contained"
                size="large"
                sx={{
                  textTransform: "none",
                  px: 4,
                  bgcolor: theme.palette.tertiary.main,
                  color: theme.palette.getContrastText(theme.palette.tertiary.main),
                  "&:hover": { bgcolor: theme.palette.tertiary.fixedDim },
                }}
              >
                Get Started
              </Button>
              <Button
                component={RouterLink}
                to={ROUTES.CONTACT}
                onClick={() => trackEvent("book_demo_click", { location: "hero" })}
                variant="outlined"
                size="large"
                sx={{ textTransform: "none", px: 4 }}
              >
                Book a Demo
              </Button>
            </Box>
            <Typography sx={{ mt: 2, fontSize: "0.8rem", color: theme.palette.text.secondary }}>
              14-day free trial · No card required
            </Typography>
          </Box>

          {/* Abstract product visualization -- built from real UI tokens/data,
              not a stock photo or fabricated screenshot. */}
          <Paper
            sx={{
              borderRadius: 4,
              p: 3,
              bgcolor: theme.palette.primary.main,
              border: "none",
              boxShadow: "0 24px 48px -24px rgba(10, 37, 64, 0.45)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700 }}>Today's Overview</Typography>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 9999,
                  bgcolor: "rgba(224,194,152,0.18)",
                  color: theme.palette.tertiary.fixed,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                LIVE
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
              {[
                { label: "Gold 24K / g", value: "₹15,864" },
                { label: "Silver / g", value: "₹241.5" },
                { label: "Today's Sales", value: "₹1,32,400" },
                { label: "Outstanding", value: "₹28,600" },
              ].map((stat) => (
                <Box key={stat.label} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>{stat.label}</Typography>
                  <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "1.1rem" }}>{stat.value}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2, p: 1.5 }}>
              <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", mb: 1 }}>
                Recent Activity
              </Typography>
              {["Invoice #IS/312 generated", "Stock updated — 22K Gold Ring", "Payment received — Udhaar cleared"].map(
                (line) => (
                  <Box key={line} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                    <SymbolIcon name="check_circle" size={14} sx={{ color: theme.palette.tertiary.fixed }} />
                    <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>{line}</Typography>
                  </Box>
                )
              )}
            </Box>
          </Paper>
        </Box>
      </Section>

      {/* Trust / value proposition */}
      <Section sx={{ bgcolor: theme.palette.background.paper }}>
        <SectionHeading eyebrow="Platform" title="Everything Your Jewellery Business Needs" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.short} />
          ))}
        </Box>
      </Section>

      {/* Problem / Solution */}
      <Section>
        <SectionHeading
          eyebrow="Why RatnSetu"
          title="From Registers and Spreadsheets to One Smart System"
          subtitle="Real problems jewellery shops deal with every day — and how RatnSetu addresses each one."
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {PROBLEM_SOLUTION_ITEMS.map((item) => (
            <Paper key={item.problem} sx={{ p: 2.5, borderRadius: 3, display: "flex", gap: 2 }}>
              <SymbolIcon name="arrow_forward" size={20} sx={{ color: theme.palette.tertiary.main, mt: "3px", flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 0.5 }}>
                  {item.problem}
                </Typography>
                <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{item.solution}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* Product features -- alternating layout */}
      <Section sx={{ bgcolor: theme.palette.background.paper }}>
        <SectionHeading eyebrow="A closer look" title="Built Around How Jewellery Businesses Actually Work" />
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 5, sm: 7 } }}>
          {PRODUCT_DETAIL_SECTIONS.map((section, index) => (
            <Box
              key={section.title}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 3, md: 6 },
                alignItems: "center",
              }}
            >
              <Box sx={{ order: { xs: 1, md: index % 2 === 0 ? 1 : 2 } }}>
                <SymbolIcon name={section.icon} size={36} sx={{ color: theme.palette.tertiary.main, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1.5 }}>
                  {section.title}
                </Typography>
                <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                  {section.description}
                </Typography>
              </Box>
              <Box sx={{ order: { xs: 2, md: index % 2 === 0 ? 2 : 1 } }}>
                <Paper
                  sx={{
                    borderRadius: 3,
                    p: 4,
                    textAlign: "center",
                    bgcolor: theme.palette.surfaces.low,
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary, mb: 1 }}>
                    {section.stat.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "2rem", color: theme.palette.primary.main }}>
                    {section.stat.value}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}
        </Box>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeading eyebrow="Getting started" title="How RatnSetu Works" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" },
            gap: 3,
          }}
        >
          {HOW_IT_WORKS_STEPS.map((step) => (
            <Box key={step.step} sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: theme.palette.primary.main,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  mx: "auto",
                  mb: 2,
                }}
              >
                {step.step}
              </Box>
              <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.75 }}>
                {step.title}
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary }}>
                {step.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* Pricing */}
      <Section sx={{ bgcolor: theme.palette.background.paper }}>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, Transparent Pricing"
          subtitle="Start with a 14-day free trial. Cancel anytime."
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 3,
            maxWidth: 720,
            mx: "auto",
          }}
        >
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.key} plan={plan} />
          ))}
        </Box>
        <Typography sx={{ textAlign: "center", mt: 3 }}>
          <Button component={RouterLink} to={ROUTES.PRICING} sx={{ textTransform: "none" }}>
            See full plan comparison →
          </Button>
        </Typography>
      </Section>

      {/* Testimonials */}
      <Section>
        <SectionHeading eyebrow="Customers" title="What Jewellery Retailers Say" />
        <TestimonialCarousel testimonials={TESTIMONIALS} />
      </Section>

      {/* Blog teaser -- internal link to /blogs per site's linking structure */}
      <Section sx={{ bgcolor: theme.palette.background.paper }}>
        <SectionHeading eyebrow="Learn" title="Jewellery Business Insights" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            mb: 3,
          }}
        >
          {BLOGS.slice(0, 3).map((blog) => (
            <BlogCard key={blog.slug} blog={blog} />
          ))}
        </Box>
        <Typography sx={{ textAlign: "center" }}>
          <Button component={RouterLink} to={ROUTES.BLOGS} sx={{ textTransform: "none" }}>
            View all articles →
          </Button>
        </Typography>
      </Section>

      <CTASection context="home" />
      </main>
      <MarketingFooter />
    </Box>
  );
}

export default LandingPage;
