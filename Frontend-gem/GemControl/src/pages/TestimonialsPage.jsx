import { Box, Typography, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import CTASection from "../components/marketing/CTASection";
import Seo from "../components/marketing/Seo";
import TestimonialCard from "../components/marketing/TestimonialCard";
import { TESTIMONIALS } from "../data/testimonials";
import { PAGE_SEO } from "../data/siteConfig";

function TestimonialsPage() {
  const theme = useTheme();
  const hasSamples = TESTIMONIALS.some((t) => t.isSample);

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo
        title={PAGE_SEO.testimonials.title}
        description={PAGE_SEO.testimonials.description}
        path={PAGE_SEO.testimonials.path}
      />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center", mb: 5 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            What Jewellery Businesses Say About RatnSetu
          </Typography>
        </Box>

        {hasSamples && (
          <Box sx={{ maxWidth: 800, mx: "auto", mb: 4 }}>
            <Alert severity="info">
              The testimonials below are sample/demo content used during development, not verified
              real customers. They'll be replaced with real, permissioned testimonials as they
              become available.
            </Alert>
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            maxWidth: 1100,
            mx: "auto",
          }}
        >
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </Box>
      </Box>

      <CTASection context="testimonials" />
      </main>
      <MarketingFooter />
    </Box>
  );
}

export default TestimonialsPage;
