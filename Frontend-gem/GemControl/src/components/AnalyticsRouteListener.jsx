import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "../utils/analytics";

// Mounted once inside <BrowserRouter>. Initializes GA4 (no-op if
// VITE_GA_MEASUREMENT_ID isn't set) and fires exactly one page_view per
// route change, including the first render -- GA4's own automatic
// pageview-on-script-load is disabled in analytics.js specifically so this
// is the only source of page_view events, avoiding double counting.
function AnalyticsRouteListener() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // Helmet updates document.title in its own effect; defer one frame so
    // this reads the new page's title instead of the previous route's.
    const raf = requestAnimationFrame(() => {
      trackPageView(location.pathname + location.search, document.title);
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.search]);

  return null;
}

export default AnalyticsRouteListener;
