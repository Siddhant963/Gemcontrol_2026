import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import SymbolIcon from "../SymbolIcon";
import { trackEvent } from "../../utils/analytics";

const NAV_LINKS = [
  { label: "Home", to: ROUTES.LANDING },
  { label: "About", to: ROUTES.ABOUT },
  { label: "Features", to: ROUTES.FEATURES },
  { label: "Pricing", to: ROUTES.PRICING },
  { label: "Testimonials", to: ROUTES.TESTIMONIALS },
  { label: "Blogs", to: ROUTES.BLOGS },
  { label: "Contact", to: ROUTES.CONTACT },
];

function MarketingHeader() {
  const theme = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to) => (to === ROUTES.LANDING ? location.pathname === to : location.pathname.startsWith(to));

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 1, gap: 2 }}>
          <Box
            component={RouterLink}
            to={ROUTES.LANDING}
            sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none", flexShrink: 0 }}
          >
            <Box component="img" src="/ratnsetu-icon.png" alt="RatnSetu" sx={{ width: 32, height: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              RatnSetu
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box component="nav" aria-label="Main" sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
            {NAV_LINKS.map((link) => (
              <Button
                key={link.to}
                component={RouterLink}
                to={link.to}
                sx={{
                  textTransform: "none",
                  fontWeight: isActive(link.to) ? 700 : 500,
                  color: isActive(link.to) ? theme.palette.primary.main : theme.palette.text.secondary,
                  px: 1.5,
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5, ml: 2 }}>
            <Button
              component={RouterLink}
              to={ROUTES.LOGIN}
              onClick={() => trackEvent("login_click", { location: "header" })}
              sx={{ textTransform: "none" }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to={ROUTES.REGISTER}
              onClick={() => trackEvent("get_started_click", { location: "header" })}
              variant="contained"
              sx={{
                textTransform: "none",
                bgcolor: theme.palette.tertiary.main,
                color: theme.palette.getContrastText(theme.palette.tertiary.main),
                "&:hover": { bgcolor: theme.palette.tertiary.fixedDim },
              }}
            >
              Get Started
            </Button>
          </Box>

          <IconButton
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <SymbolIcon name="menu" size={26} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }} role="presentation">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              RatnSetu
            </Typography>
            <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <SymbolIcon name="close" size={22} />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {NAV_LINKS.map((link) => (
              <ListItem key={link.to} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  selected={isActive(link.to)}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              component={RouterLink}
              to={ROUTES.LOGIN}
              variant="outlined"
              fullWidth
              sx={{ textTransform: "none" }}
              onClick={() => {
                trackEvent("login_click", { location: "header_mobile" });
                setMobileOpen(false);
              }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to={ROUTES.REGISTER}
              variant="contained"
              fullWidth
              sx={{
                textTransform: "none",
                bgcolor: theme.palette.tertiary.main,
                color: theme.palette.getContrastText(theme.palette.tertiary.main),
              }}
              onClick={() => {
                trackEvent("get_started_click", { location: "header_mobile" });
                setMobileOpen(false);
              }}
            >
              Get Started
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default MarketingHeader;
