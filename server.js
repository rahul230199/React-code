/* =========================================================
   AXO NETWORKS — MAIN SERVER
   Clean • Stable • Production Ready
========================================================= */

const path = require("path");

/* =========================================================
   ENV CONFIG (AUTO SWITCH LOCAL / PRODUCTION)
========================================================= */

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

require("dotenv").config({
  path: path.resolve(__dirname, envFile),
});

console.log("🌍 Running Mode:", process.env.NODE_ENV || "local");

/* =========================================================
   IMPORTS
========================================================= */

const express = require("express");
const pool = require("./src/config/db");

// Route Files
const authRoutes = require("./routes/auth.routes");
const rfqRoutes = require("./routes/rfq.routes");
const rfqFilesRoutes = require("./routes/rfqFiles.routes");
const quoteRoutes = require("./routes/quote.routes");
const quoteAcceptanceRoutes = require("./routes/quoteAcceptance.routes");
const rfqMessageRoutes = require("./routes/rfqMessage.routes");
const purchaseOrderRoutes = require("./routes/purchaseOrder.routes");
const networkRequestRoutes = require("./routes/networkRequest.routes");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json({ limit: "5mb" }));

/* =========================================================
   CORS (SAFE VERSION)
========================================================= */

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/rfq-files", rfqFilesRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/quotes", quoteAcceptanceRoutes);
app.use("/api/rfq-messages", rfqMessageRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/network-request", networkRequestRoutes);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/_health", async (_, res) => {
  try {
    const r = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      dbTime: r.rows[0].now,
    });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================================================
   API 404 FALLBACK
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Invalid API route",
  });
});

/* =========================================================
   STATIC FRONTEND
========================================================= */

const frontendPath = path.join(__dirname, "frontend");
app.use(express.static(frontendPath));

/* =========================================================
   CLEAN HTML ROUTING
========================================================= */

app.get("/:page", (req, res, next) => {
  if (req.params.page.startsWith("api")) return next();

  const filePath = path.join(frontendPath, `${req.params.page}.html`);

  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(`🚀 AXO API running on port ${PORT}`);
});
