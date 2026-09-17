import { Breadcrumbs as MuiBreadcrumbs, Typography, Link as MuiLink, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import SymbolIcon from "../SymbolIcon";
import { SITE_CONFIG } from "../../data/siteConfig";

// `items` is [{ label, to }] with the current (non-linked) page last.
// Renders visible breadcrumbs -- pair with breadcrumbSchema(items) passed
// into <Seo structuredData={...}> so the visible trail and the JSON-LD
// BreadcrumbList always match.
function Breadcrumbs({ items }) {
  const theme = useTheme();
  return (
    <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, pt: 2 }}>
      <MuiBreadcrumbs
        aria-label="breadcrumb"
        separator={<SymbolIcon name="chevron_right" size={16} />}
        sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary, maxWidth: 1200, mx: "auto" }}
      >
        {items.map((item, i) =>
          i === items.length - 1 ? (
            <Typography key={item.label} sx={{ fontSize: "0.85rem", color: theme.palette.text.primary, fontWeight: 600 }}>
              {item.label}
            </Typography>
          ) : (
            <MuiLink
              key={item.label}
              component={RouterLink}
              to={item.to}
              underline="hover"
              sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary }}
            >
              {item.label}
            </MuiLink>
          )
        )}
      </MuiBreadcrumbs>
    </Box>
  );
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${SITE_CONFIG.siteUrl}${item.to || ""}`,
    })),
  };
}

export default Breadcrumbs;
