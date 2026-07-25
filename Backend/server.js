const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./Config/DbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const adminRoutes = require("./Routes/AdminRoutes");
const { initializeCronJobs } = require("./Utils/cronJobs");
const path = require("path");

dotenv.config();

const app = express();

// CORS Configuration - Environment-based
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || "http://13.233.204.102:3002"]
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (backend and legacy root)
app.use("/Uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/Uploads", express.static(path.join(__dirname, "../Uploads")));

// API Routes
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
