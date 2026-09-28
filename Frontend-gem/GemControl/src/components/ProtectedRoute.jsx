import { Navigate, Outlet, useLocation } from "react-router-dom"; // Added Outlet
import { useSelector, useDispatch } from "react-redux";
import { ROUTES } from "../utils/routes";
import { setAuthChecked } from "../redux/authSlice";
import { useEffect, useState } from "react";
import api from "../utils/api";

function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isAuthChecked = useSelector((state) => state.auth.isAuthChecked);
  const dispatch = useDispatch();
  const location = useLocation();
  // Account Settings (self-service deletion) must stay reachable even with
  // an expired/cancelled subscription -- same reasoning as SUBSCRIBE being
  // routed outside this gate entirely: a locked-out user must still be
  // able to delete their own account, not just be stuck staring at the
  // paywall with no way back to it (the backend's /deleteAccount route is
  // likewise reachable pre-subscription-check -- see AdminRoutes.js).
  const isExemptFromSubscriptionGate = location.pathname === ROUTES.ACCOUNT_SETTINGS;

  // 'unknown' until the check resolves. Failing this open (treating a
  // network error as "active") is deliberate -- the backend still enforces
  // the real gate with a 402 on every data route (see utils/api.js), so a
  // transient failure here just means one extra round trip, not a bypass.
  const [subscriptionActive, setSubscriptionActive] = useState("unknown");

  useEffect(() => {
    if (!isAuthChecked) {
      dispatch(setAuthChecked());
    }
  }, [dispatch, isAuthChecked]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    api
      .get("/getMySubscription")
      .then((res) => {
        if (!cancelled) setSubscriptionActive(res.data.isActive);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionActive(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (subscriptionActive === "unknown" && !isExemptFromSubscriptionGate) {
    return null;
  }

  if (!subscriptionActive && !isExemptFromSubscriptionGate) {
    return <Navigate to={ROUTES.SUBSCRIBE} />;
  }

  return <Outlet />; // Render the nested Route components
}

export default ProtectedRoute;
