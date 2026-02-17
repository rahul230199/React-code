/* =========================================================
   AXO NETWORKS — BACKEND SERVER (PRODUCTION STRUCTURE)
========================================================= */

const path = require("path");
const express = require("express");
const cors = require("cors");

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
const sellerRoutes =require("./src/modules/supplier/supplier.routes");

/* =========================================================
   APP INITIALIZATION
========================================================= */

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   GLOBAL MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json({ limit: "5mb" }));

/* =========================================================
   STATIC FRONTEND (IMPORTANT)
========================================================= */

const frontendPath = path.join(__dirname, "../axo_frontend");
app.use(express.static(frontendPath));

/* =========================================================
   CLEAN FRONTEND ROUTES (NO .HTML)
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

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/supplier", sellerRoutes);

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
   FRONTEND FALLBACK (OPTIONAL SPA SUPPORT)
========================================================= */

app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return res.sendFile(path.join(frontendPath, "login.html"));
  }
  next();
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});