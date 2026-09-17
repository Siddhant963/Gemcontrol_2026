import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../utils/routes";
import SymbolIcon from "../components/SymbolIcon";
import Seo from "../components/marketing/Seo";

const MARKETING_LINKS = [
  { label: "Home", to: ROUTES.LANDING },
  { label: "Features", to: ROUTES.FEATURES },
  { label: "Pricing", to: ROUTES.PRICING },
  { label: "Blogs", to: ROUTES.BLOGS },
  { label: "Contact", to: ROUTES.CONTACT },
];

function NotFound() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        gap: 1.5,
      }}
    >
      {/* Never let a broken URL be indexed as a normal page. */}
      <Seo title="Page Not Found | RatnSetu" description="The page you're looking for doesn't exist or may have been moved." path="/404" noindex />

      <SymbolIcon name="search_off" size={64} sx={{ color: theme.palette.text.secondary, mb: 1 }} />
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 420, mb: 2 }}>
        The page you're looking for doesn't exist or may have been moved.
      </Typography>

      {isAuthenticated ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          sx={{ textTransform: "none" }}
        >
          Back to Dashboard
        </Button>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
          {MARKETING_LINKS.map((link, i) => (
            <Button
              key={link.to}
              component={RouterLink}
              to={link.to}
              variant={i === 0 ? "contained" : "outlined"}
              sx={{ textTransform: "none" }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default NotFound;
