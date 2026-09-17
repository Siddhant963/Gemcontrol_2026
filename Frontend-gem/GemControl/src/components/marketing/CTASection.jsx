import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { trackEvent } from "../../utils/analytics";

// `context` identifies which page/section this CTA renders in (e.g. "home",
// "blog", "features", "pricing") so clicks are attributable in GA4 without
// needing a separate component per page. Fires the generic
// get_started_click/book_demo_click plus a page-specific event
// (blog_cta_click / feature_cta_click) when relevant.
function CTASection({
  title = "Ready to bring your jewellery business into one smart system?",
  subtitle,
  context = "generic",
}) {
  const theme = useTheme();

  const handleGetStarted = () => {
    trackEvent("get_started_click", { location: context });
    if (context === "blog") trackEvent("blog_cta_click", { location: context });
    if (context === "features") trackEvent("feature_cta_click", { location: context });
  };

  const handleBookDemo = () => {
    trackEvent("book_demo_click", { location: context });
  };
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 6, sm: 8 },
        textAlign: "center",
        bgcolor: theme.palette.primary.main,
      }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "1.4rem", sm: "1.9rem" }, mb: subtitle ? 1.5 : 3 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: "rgba(255,255,255,0.75)", mb: 3 }}>{subtitle}</Typography>
        )}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            component={RouterLink}
            to={ROUTES.REGISTER}
            onClick={handleGetStarted}
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
            onClick={handleBookDemo}
            variant="outlined"
            size="large"
            sx={{
              textTransform: "none",
              px: 4,
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            Book a Demo
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default CTASection;
