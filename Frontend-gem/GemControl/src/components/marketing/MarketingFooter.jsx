import { Box, Typography, Link as MuiLink } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { SITE_CONFIG } from "../../data/siteConfig";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: ROUTES.FEATURES },
      { label: "Pricing", to: ROUTES.PRICING },
      { label: "Testimonials", to: ROUTES.TESTIMONIALS },
      { label: "Blogs", to: ROUTES.BLOGS },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: ROUTES.ABOUT },
      { label: "Contact", to: ROUTES.CONTACT },
      { label: "Privacy Policy", to: ROUTES.PRIVACY_POLICY },
      { label: "Terms & Conditions", to: ROUTES.TERMS },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact Support", to: ROUTES.CONTACT },
      { label: "Help", to: ROUTES.CONTACT },
    ],
  },
];

function MarketingFooter() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        px: { xs: 2, sm: 4, md: 8 },
        pt: { xs: 5, sm: 6 },
        pb: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1.4fr repeat(3, 1fr)" },
          gap: { xs: 4, sm: 3 },
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
            <Box component="img" src="/ratnsetu-icon.png" alt="RatnSetu" sx={{ width: 30, height: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              RatnSetu
            </Typography>
          </Box>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.9rem", maxWidth: 320 }}>
            Complete jewellery business management ERP for modern jewellery retailers.
          </Typography>
        </Box>

        {COLUMNS.map((col) => (
          <Box key={col.heading}>
            <Typography
              variant="overline"
              sx={{ color: theme.palette.text.secondary, display: "block", mb: 1.5 }}
            >
              {col.heading}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {col.links.map((link) => (
                <MuiLink
                  key={link.label}
                  component={RouterLink}
                  to={link.to}
                  underline="hover"
                  sx={{ color: theme.palette.text.primary, fontSize: "0.9rem" }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          mt: 5,
          pt: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>
          © {new Date().getFullYear()} RatnSetu. All rights reserved.
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>
          Developed by{" "}
          <MuiLink
            href={SITE_CONFIG.legalCompanyUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}
          >
            {SITE_CONFIG.legalCompanyName}
          </MuiLink>
        </Typography>
      </Box>
    </Box>
  );
}

export default MarketingFooter;
