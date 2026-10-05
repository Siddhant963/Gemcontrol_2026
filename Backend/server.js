const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./Config/DbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const adminRoutes = require("./Routes/AdminRoutes");
const platformRoutes = require("./Routes/platformRoutes");
const { initializeCronJobs } = require("./Utils/cronJobs");
const { razorpayWebhook, appleAppStoreNotifications } = require("./Controllers/adminController");
const path = require("path");

dotenv.config();

// Safety net: on Node 15+, an unhandled promise rejection crashes the
// entire process by default. That's exactly what took production down
// (a fire-and-forget addActivity() call in Utils/cronJobs.js threw on a
// bad ObjectId, with nothing awaiting it) -- fixed at the source, but this
// stays as a backstop so one isolated, unawaited failure anywhere else in
// the app can never do the same again. Deliberately does NOT install an
// uncaughtException handler -- that indicates the process may be in a
// genuinely inconsistent state, where letting it crash and restart (Render
// does this automatically) is safer than continuing.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection (server continues running):", reason);
});

const app = express();

// The apex domain (ratnsetu.com) and its "www." subdomain are two
// DIFFERENT origins as far as a browser's CORS check is concerned, even
// though they're the same site to a human -- a visitor can land on either
// depending on how they typed the URL, an old bookmark, a search engine
// result, a shared link, etc. This derives both variants from whichever
// one FRONTEND_URL happens to be set to, so CORS never breaks purely
// because of which variant was configured (this is exactly what caused a
// "CORS error" / failed preflight on ratnsetu.com when FRONTEND_URL was
// set to https://www.ratnsetu.com only).
function withWwwVariant(urlString) {
  try {
    const parsed = new URL(urlString);
    const altHostname = parsed.hostname.startsWith("www.")
      ? parsed.hostname.slice(4)
      : `www.${parsed.hostname}`;
    const port = parsed.port ? `:${parsed.port}` : "";
    const altOrigin = `${parsed.protocol}//${altHostname}${port}`;
    return [parsed.origin, altOrigin];
  } catch {
    // Malformed FRONTEND_URL -- fall back to whatever was given rather
    // than crashing CORS setup entirely.
    return [urlString];
  }
}

// CORS Configuration - Environment-based
// TEMP: local dev origins are allowed in production too, to test the
// Razorpay payment flow from a local web/Flutter-web build against the
// live backend. Remove these two once payment-gateway testing is done.
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      ...withWwwVariant(process.env.FRONTEND_URL || "https://ratnsetu.com"),
      "http://localhost:5173",
      "http://localhost:8765",
    ]
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Razorpay webhook -- must be mounted before the global express.json()
// below with its own raw-body parser, since signature verification needs
// the exact raw bytes Razorpay signed, not a re-serialized parsed object.
app.post(
  "/api/admin/razorpayWebhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

// App Store Server Notifications V2 -- same raw-body reasoning as the
// Razorpay webhook above (Apple's signedPayload verification needs the
// exact bytes it signed). Configure this exact URL in App Store Connect
// under Users and Access > Integrations > App Store Server Notifications,
// for both the Sandbox and Production environments.
app.post(
  "/api/admin/apple/notifications",
  express.raw({ type: "application/json" }),
  appleAppStoreNotifications
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (backend and legacy root)
app.use("/Uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/Uploads", express.static(path.join(__dirname, "../Uploads")));

// API Routes
// Platform-owner panel (read-only, superadmin only). Must be mounted BEFORE
// the main admin router -- see Routes/platformRoutes.js.
app.use("/api/admin/platform", platformRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Optional: serve the built frontend from the same server/port (used for the
// portable USB deployment, where there is no separate Vite dev server).
// Set FRONTEND_DIST_PATH to the built frontend's dist/ folder to enable.
if (process.env.FRONTEND_DIST_PATH) {
  const frontendDistPath = path.resolve(__dirname, process.env.FRONTEND_DIST_PATH);
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api|\/Uploads).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server initialization
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📁 Uploads URL: http://localhost:${PORT}/Uploads`);
      
      // Initialize cron jobs after server starts
      initializeCronJobs();
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  });
