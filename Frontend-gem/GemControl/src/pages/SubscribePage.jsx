import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Button, Paper, Chip, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api";
import { ROUTES } from "../utils/routes";
import { logout } from "../redux/authSlice";
import SymbolIcon from "../components/SymbolIcon";

function daysLeft(endDate) {
  if (!endDate) return 0;
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.max(Math.ceil(ms / (24 * 60 * 60 * 1000)), 0);
}

function SubscribePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingKey, setActivatingKey] = useState(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get("/getSubscriptionPlans"),
        api.get("/getMySubscription"),
      ]);
      setPlans(plansRes.data);
      setMySubscription(subRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActivate = async (planKey) => {
    if (!isAdmin) return;
    setActivatingKey(planKey);
    setError("");
    try {
      const { data: order } = await api.post("/createSubscriptionOrder", { planKey });
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "RatnSetu",
        description: order.plan?.name ? `${order.plan.name} plan` : "Subscription",
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.contact || "",
        },
        theme: { color: theme.palette.primary.main },
        handler: async (response) => {
          try {
            await api.post("/verifySubscriptionPayment", { ...response, planKey });
            navigate(ROUTES.DASHBOARD);
          } catch (err) {
            setError(err.response?.data?.message || "Payment verification failed");
            setActivatingKey(null);
          }
        },
        modal: {
          ondismiss: () => setActivatingKey(null),
        },
      });
      rzp.on("payment.failed", (response) => {
        setError(response.error?.description || "Payment failed");
        setActivatingKey(null);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start checkout");
      setActivatingKey(null);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  const sub = mySubscription?.subscription;
  const isTrialing = sub?.status === "trialing" && mySubscription?.isActive;

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh", py: { xs: 4, sm: 6 } }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box component="img" src="/ratnsetu-icon.png" alt="RatnSetu" sx={{ width: 32, height: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              RatnSetu
            </Typography>
          </Box>
          <Button onClick={handleLogout} sx={{ textTransform: "none" }}>
            Log out
          </Button>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: "center", mb: 1 }}>
          {isTrialing ? "Choose a Plan Anytime" : "Subscribe to Continue"}
        </Typography>
        <Typography sx={{ textAlign: "center", color: theme.palette.text.secondary, mb: 1 }}>
          {isTrialing
            ? `Your free trial is active — ${daysLeft(sub.endDate)} day(s) left.`
            : sub
            ? "Your subscription has ended. Pick a plan below to keep using RatnSetu."
            : "Pick a plan below to start using RatnSetu."}
        </Typography>
        {!isAdmin && (
          <Typography sx={{ textAlign: "center", fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 4 }}>
            Only your shop's admin can subscribe or renew. Please contact them.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(plans.length, 2)}, 1fr)` },
              gap: 3,
            }}
          >
            {plans.map((plan, index) => {
              const isCurrentPlan = sub?.plan?._id === plan._id || sub?.plan === plan._id;
              const highlighted = index === plans.length - 1 && plans.length > 1;
              return (
                <Paper
                  key={plan._id}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: highlighted
                      ? `2px solid ${theme.palette.secondary.main}`
                      : `1px solid ${theme.palette.divider}`,
                    position: "relative",
                  }}
                >
                  {highlighted && (
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
                  <Typography sx={{ fontWeight: 700, fontSize: "1.2rem" }}>{plan.name}</Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, my: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "2rem", color: theme.palette.primary.main }}>
                      ₹{plan.price.toLocaleString()}
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      /{plan.billingInterval}
                    </Typography>
                  </Box>
                  {plan.features.map((f) => (
                    <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <SymbolIcon name="check_circle" sx={{ fontSize: 18, color: theme.palette.secondary.dark }} />
                      <Typography sx={{ fontSize: "0.9rem" }}>{f}</Typography>
                    </Box>
                  ))}
                  <Button
                    fullWidth
                    variant={highlighted ? "contained" : "outlined"}
                    disabled={!isAdmin || activatingKey === plan.key || isCurrentPlan}
                    onClick={() => handleActivate(plan.key)}
                    sx={{
                      mt: 2,
                      textTransform: "none",
                      ...(highlighted && {
                        bgcolor: theme.palette.primary.main,
                        "&:hover": { bgcolor: theme.palette.primary.dark },
                      }),
                    }}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : activatingKey === plan.key
                      ? "Opening checkout..."
                      : isTrialing || sub
                      ? "Renew"
                      : "Subscribe"}
                  </Button>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default SubscribePage;
