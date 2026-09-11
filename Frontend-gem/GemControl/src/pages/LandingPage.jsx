import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import {
  Inventory2,
  ReceiptLong,
  People,
  AccountBalanceWallet,
  Diamond,
  PhoneIphone,
  CheckCircle,
} from "@mui/icons-material";
import { ROUTES } from "../utils/routes";

const FEATURES = [
  {
    icon: Inventory2,
    title: "Stock & Raw Material Inventory",
    description: "Track every item and raw material with live gold, silver and diamond rates.",
  },
  {
    icon: ReceiptLong,
    title: "GST-Compliant Billing",
    description: "Generate accurate, tax-ready invoices in seconds, with full GST breakdowns.",
  },
  {
    icon: People,
    title: "Customer & Udhar Tracking",
    description: "Keep every customer's purchase history and outstanding credit in one place.",
  },
  {
    icon: Diamond,
    title: "Girvi / Pledge Management",
    description: "Track pledged items with automatic monthly interest accrual and easy redemption.",
  },
  {
    icon: AccountBalanceWallet,
    title: "Multi-Staff, One Firm",
    description: "Give your team role-based access under a single shop account, admin-controlled.",
  },
  {
    icon: PhoneIphone,
    title: "Companion Mobile App",
    description: "Manage your shop on the go with the RatnSetu Android app, in sync with the web.",
  },
];

const PLANS = [
  {
    name: "Basic",
    price: "₹999",
    interval: "/month",
    features: [
      "Stock & raw material inventory",
      "Live gold / silver / diamond rates",
      "GST-compliant billing & invoicing",
      "Customer & Udhar tracking",
      "Up to 3 staff accounts",
      "Excel export / backup",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹1,999",
    interval: "/month",
    features: [
      "Everything in Basic",
      "Unlimited staff accounts",
      "Girvi / pledge loan management",
      "Priority support",
    ],
    highlighted: true,
  },
];

function Section({ children, sx }) {
  return (
    <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 5, sm: 7 }, ...sx }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>{children}</Box>
    </Box>
  );
}

function LandingPage() {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 4, md: 8 },
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box component="img" src="/ratnsetu-icon.png" alt="RatnSetu" sx={{ width: 36, height: 36 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            RatnSetu
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button component={RouterLink} to={ROUTES.LOGIN} sx={{ textTransform: "none" }}>
            Login
          </Button>
          <Button
            component={RouterLink}
            to={ROUTES.REGISTER}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Section sx={{ textAlign: "center", pt: { xs: 4, sm: 6 } }}>
        <Box component="img" src="/ratnsetu-logo.png" alt="RatnSetu" sx={{ width: { xs: 140, sm: 180 }, mb: 2 }} />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: { xs: "1.8rem", sm: "2.5rem", md: "3rem" },
            mb: 1.5,
          }}
        >
          Jewellery Shop Management, Simplified
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 400,
            maxWidth: 640,
            mx: "auto",
            mb: 4,
            fontSize: { xs: "0.95rem", sm: "1.1rem" },
          }}
        >
          Inventory, billing, customers, pledges and staff — everything your jewellery shop
          needs, in one place, on the web and on your phone.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            component={RouterLink}
            to={ROUTES.REGISTER}
            variant="contained"
            size="large"
            sx={{
              textTransform: "none",
              px: 4,
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            }}
          >
            Start Free Trial
          </Button>
          <Button
            component={RouterLink}
            to={ROUTES.LOGIN}
            variant="outlined"
            size="large"
            sx={{ textTransform: "none", px: 4 }}
          >
            Login
          </Button>
        </Box>
        <Typography sx={{ mt: 2, fontSize: "0.8rem", color: theme.palette.text.secondary }}>
          14-day free trial · No card required
        </Typography>
      </Section>

      {/* Features */}
      <Section>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", fontWeight: 700, mb: 5, color: theme.palette.text.primary }}
        >
          Everything Your Shop Needs
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Paper
                key={feature.title}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                }}
              >
                <Icon sx={{ fontSize: 34, color: theme.palette.secondary.dark, mb: 1.5 }} />
                <Typography sx={{ fontWeight: 700, mb: 0.75, color: theme.palette.text.primary }}>
                  {feature.title}
                </Typography>
                <Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary }}>
                  {feature.description}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Section>

      {/* Pricing */}
      <Section sx={{ bgcolor: theme.palette.background.paper }}>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", fontWeight: 700, mb: 1, color: theme.palette.text.primary }}
        >
          Simple, Transparent Pricing
        </Typography>
        <Typography sx={{ textAlign: "center", color: theme.palette.text.secondary, mb: 5 }}>
          Start with a 14-day free trial. Cancel anytime.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 3,
            maxWidth: 720,
            mx: "auto",
          }}
        >
          {PLANS.map((plan) => (
            <Paper
              key={plan.name}
              sx={{
                p: 3,
                borderRadius: 3,
                border: plan.highlighted
                  ? `2px solid ${theme.palette.secondary.main}`
                  : `1px solid ${theme.palette.divider}`,
                position: "relative",
              }}
            >
              {plan.highlighted && (
                <Chip
                  label="Most Popular"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -12,
                    right: 16,
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    fontWeight: 700,
                  }}
                />
              )}
              <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", color: theme.palette.text.primary }}>
                {plan.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, my: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "2rem", color: theme.palette.primary.main }}>
                  {plan.price}
                </Typography>
                <Typography sx={{ color: theme.palette.text.secondary }}>{plan.interval}</Typography>
              </Box>
              {plan.features.map((f) => (
                <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: theme.palette.secondary.dark }} />
                  <Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.primary }}>{f}</Typography>
                </Box>
              ))}
              <Button
                component={RouterLink}
                to={ROUTES.REGISTER}
                fullWidth
                variant={plan.highlighted ? "contained" : "outlined"}
                sx={{
                  mt: 2,
                  textTransform: "none",
                  ...(plan.highlighted && {
                    bgcolor: theme.palette.primary.main,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                  }),
                }}
              >
                Start Free Trial
              </Button>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* Footer */}
      <Box
        sx={{
          px: { xs: 2, sm: 4, md: 8 },
          py: 3,
          textAlign: "center",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>
          © {new Date().getFullYear()} RatnSetu. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default LandingPage;
