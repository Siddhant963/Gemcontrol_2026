import { ANALYTICS_CONFIG } from "../data/siteConfig";

// GA4 wrapper that no-ops cleanly when VITE_GA_MEASUREMENT_ID isn't set --
// the site must work identically with or without analytics configured.
// Never pass PII (email, phone, message content, names) as event params;
// only page paths, button locations, plan keys, and blog slugs/categories.

let initialized = false;

export function initAnalytics() {
  const measurementId = ANALYTICS_CONFIG.gaMeasurementId;
  if (!measurementId || initialized || typeof window === "undefined") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args) => window.dataLayer.push(args);
  window.gtag = gtag;
  gtag("js", new Date());
  // send_page_view disabled -- route changes are tracked manually (see
  // AnalyticsRouteListener) so SPA navigations aren't double-counted against
  // GA4's own automatic pageview-on-load.
  gtag("config", measurementId, { send_page_view: false });

  initialized = true;
}

export function trackPageView(path, title) {
  if (!initialized || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

export function trackEvent(eventName, params = {}) {
  if (!initialized || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
