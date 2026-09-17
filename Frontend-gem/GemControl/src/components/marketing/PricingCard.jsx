import { Paper, Typography, Box, Button, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import SymbolIcon from "../SymbolIcon";
import { trackEvent } from "../../utils/analytics";

function PricingCard({ plan }) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3.5,
        borderRadius: 3,
        position: "relative",
        border: plan.highlighted ? `2px solid ${theme.palette.tertiary.main}` : `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
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
            bgcolor: theme.palette.tertiary.main,
            color: theme.palette.getContrastText(theme.palette.tertiary.main),
            fontWeight: 700,
          }}
        />
      )}
      <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", color: theme.palette.text.primary }}>
        {plan.name}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, my: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "2.25rem", color: theme.palette.primary.main }}>
          ₹{plan.price.toLocaleString("en-IN")}
        </Typography>
        <Typography sx={{ color: theme.palette.text.secondary }}>{plan.interval}</Typography>
      </Box>
      {plan.maxStaff && (
        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 2 }}>
          Up to {plan.maxStaff} staff accounts
        </Typography>
      )}
      {!plan.maxStaff && (
        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 2 }}>
          Unlimited staff accounts
        </Typography>
      )}
      <Box sx={{ mb: 3 }}>
        {plan.features.map((f) => (
          <Box key={f} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
            <SymbolIcon name="check_circle" size={18} sx={{ color: theme.palette.tertiary.main, mt: "2px" }} />
            <Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.primary }}>{f}</Typography>
          </Box>
        ))}
      </Box>
      <Button
        component={RouterLink}
        to={ROUTES.REGISTER}
        onClick={() => trackEvent("get_started_click", { location: "pricing_card", plan: plan.key })}
        fullWidth
        variant={plan.highlighted ? "contained" : "outlined"}
        sx={{
          textTransform: "none",
          ...(plan.highlighted && {
            bgcolor: theme.palette.tertiary.main,
            color: theme.palette.getContrastText(theme.palette.tertiary.main),
            "&:hover": { bgcolor: theme.palette.tertiary.fixedDim },
          }),
        }}
      >
        Get Started
      </Button>
      <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary, mt: 1.5, textAlign: "center" }}>
        14-day free trial · No card required
      </Typography>
    </Paper>
  );
}

export default PricingCard;
