import { useEffect, useState, useCallback, useMemo } from "react";
import { Box, Typography, Button, Paper, Chip, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api";
import { ROUTES } from "../utils/routes";
import { logout } from "../redux/authSlice";
import SymbolIcon from "../components/SymbolIcon";
import useToast from "../hooks/useToast";
import {
  SUBSCRIPTION_PHASE,
  getPlanAction,
  getSubscriptionCopy,
  getSubscriptionPresentation,
} from "../utils/subscriptionState";

function SubscribePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  // True while re-reading the subscription after a purchase / on tab focus.
  // The page keeps showing the last known state (no spinner swap) and says
  // "Updating subscription..." until the backend answer arrives.
  const [refreshing, setRefreshing] = useState(false);
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

  // Re-read ONLY the current subscription from the backend (the source of
  // truth). Returns true on success so callers can tell a real refresh from
  // a failed one and keep whatever state they already have.
  const refreshSubscription = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get("/getMySubscription");
      setMySubscription(data);
      return true;
    } catch {
      return false;
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Coming back to this tab (e.g. after paying in another window) must not
  // show a stale subscription.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSubscription();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshSubscription]);

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
            const { data } = await api.post("/verifySubscriptionPayment", { ...response, planKey });
            // Seed from the backend-verified response immediately so the
            // screen never shows the old (pre-purchase) state, then
            // reconcile with a fresh read of the current subscription.
            if (data?.subscription) {
              setMySubscription({ subscription: data.subscription, isActive: true });
            }
            setError("");
            toast.success("Subscription activated successfully.");
            await refreshSubscription();
          } catch (err) {
            const message = err.response?.data?.message || "Payment verification failed";
            setError(message);
            toast.error(message);
            // The server may still have activated it (webhook safety net).
            await refreshSubscription();
          } finally {
            setActivatingKey(null);
          }
        },
        modal: {
          ondismiss: () => setActivatingKey(null),
        },
      });
      rzp.on("payment.failed", (response) => {
        const message = response.error?.description || "Payment failed";
        setError(message);
        toast.error(message);
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

  const presentation = useMemo(() => getSubscriptionPresentation(mySubscription), [mySubscription]);
  const copy = getSubscriptionCopy(presentation);
  const isActivePlan = presentation.phase === SUBSCRIPTION_PHASE.ACTIVE;

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
          {copy.heading}
        </Typography>
        {loading ? null : isActivePlan ? (
          <Alert
            severity="success"
            sx={{ mb: 2, alignItems: "center" }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate(ROUTES.DASHBOARD)} sx={{ textTransform: "none" }}>
                Go to Dashboard
              </Button>
            }
          >
            {copy.message}
          </Alert>
        ) : (
          <Typography sx={{ textAlign: "center", color: theme.palette.text.secondary, mb: 1 }}>
            {copy.message}
          </Typography>
        )}
        {refreshing && (
          <Typography sx={{ textAlign: "center", fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 1 }}>
            Updating subscription...
          </Typography>
        )}
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
              // Scale columns with the actual plan count instead of always
              // capping at 2 -- a 3rd+ plan was wrapping onto its own row
              // with empty grid space next to it.
              gridTemplateColumns: {
                xs: "1fr",
                sm: `repeat(${Math.min(plans.length, 2)}, 1fr)`,
                md: `repeat(${Math.min(plans.length, 4)}, 1fr)`,
              },
              gap: 3,
            }}
          >
            {plans.map((plan, index) => {
              const action = getPlanAction(presentation, plan._id, { activating: activatingKey === plan.key });
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
                    // Flex column + the button's mt:"auto" below keeps the
                    // CTA pinned to the bottom across cards even when plans
                    // have different numbers of features.
                    display: "flex",
                    flexDirection: "column",
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
                    disabled={!isAdmin || action.disabled}
                    onClick={() => handleActivate(plan.key)}
                    sx={{
                      mt: "auto",
                      textTransform: "none",
                      ...(highlighted && {
                        bgcolor: theme.palette.primary.main,
                        "&:hover": { bgcolor: theme.palette.primary.dark },
                      }),
                    }}
                  >
                    {action.label}
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
