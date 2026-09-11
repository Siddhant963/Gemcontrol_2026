import { Navigate, Outlet } from "react-router-dom"; // Added Outlet
import { useSelector, useDispatch } from "react-redux";
import { ROUTES } from "../utils/routes";
import { setAuthChecked } from "../redux/authSlice";
import { useEffect, useState } from "react";
import api from "../utils/api";

function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isAuthChecked = useSelector((state) => state.auth.isAuthChecked);
  const dispatch = useDispatch();

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

  if (subscriptionActive === "unknown") {
    return null;
  }

  if (!subscriptionActive) {
    return <Navigate to={ROUTES.SUBSCRIBE} />;
  }

  return <Outlet />; // Render the nested Route components
}

export default ProtectedRoute;
