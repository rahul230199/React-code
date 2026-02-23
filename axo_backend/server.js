/* =========================================================
   AXO NETWORKS — BACKEND SERVER (ENTERPRISE HARDENED)
========================================================= */

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const setupSwagger = require("./src/config/swagger");

/* =========================================================
   LOAD ENV BASED ON NODE_ENV
========================================================= */

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

require("dotenv").config({
  path: path.resolve(__dirname, envFile),
});

console.log("🌍 Environment:", process.env.NODE_ENV || "local");
console.log("📄 Using ENV file:", envFile);

/* =========================================================
   IMPORT DATABASE
========================================================= */

const pool = require("./src/config/db");

/* =========================================================
   IMPORT ROUTES
========================================================= */

const authRoutes = require("./src/modules/auth/auth.routes");
const networkRoutes = require("./src/modules/network/network.routes");
const adminRoutes = require("./src/modules/admin/admin.routes");
const buyerRoutes = require("./src/modules/buyer/buyer.routes");
const supplierRoutes = require("./src/modules/supplier/supplier.routes");

const {
  globalLimiter,
} = require("./src/middlewares/rateLimit.middleware");

/* =========================================================
   IMPORT GLOBAL ERROR MIDDLEWARE
========================================================= */

const errorMiddleware = require("./src/middlewares/error.middleware");

/* =========================================================
   APP INITIALIZATION
========================================================= */

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   TRUST PROXY (FOR NGINX / LOAD BALANCER)
========================================================= */

app.set("trust proxy", 1);

/* =========================================================
   GLOBAL SECURITY MIDDLEWARE
========================================================= */

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // allow frontend modules
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGIN
        : "*",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   STATIC FRONTEND (MUST COME BEFORE API & FALLBACK)
========================================================= */

const frontendPath = path.join(__dirname, "../axo_frontend");

app.use(
  express.static(frontendPath, {
    extensions: ["html"],
  })
);

/* =========================================================
   FRONTEND CLEAN ROUTES
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

app.get("/change-password", (req, res) => {
  res.sendFile(path.join(frontendPath, "change-password.html"));
});

app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin-dashboard.html"));
});

app.get("/buyer-dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "buyer-dashboard.html"));
});

app.get("/supplier-dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "supplier-dashboard.html"));
});

/* =========================================================
   API ROUTES
========================================================= */

app.use(globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/supplier", supplierRoutes);

/* =========================================================
   SWAGGER DOCUMENTATION (DEV ONLY)
========================================================= */

if (process.env.NODE_ENV !== "production") {
  setupSwagger(app);
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      environment: process.env.NODE_ENV || "local",
      database: process.env.DB_NAME,
      serverTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("Health check error:", err.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* =========================================================
   API 404 HANDLER
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =========================================================
   SAFE FRONTEND FALLBACK
   - Allows static assets
   - Allows API
   - Only fallback for real page routes
========================================================= */

app.use((req, res, next) => {

  // Allow API
  if (req.path.startsWith("/api")) {
    return next();
  }

  // Allow static files (js, css, images)
  if (req.path.includes(".")) {
    return next();
  }

  // Fallback to login page
  return res.sendFile(path.join(frontendPath, "login.html"));
});

/* =========================================================
   GLOBAL ERROR HANDLER (MUST BE LAST)
========================================================= */

app.use(errorMiddleware);

/* =========================================================
   START SERVER
========================================================= */

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("💤 Process terminated safely.");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
  server.close(() => {
    process.exit(1);
  });
});