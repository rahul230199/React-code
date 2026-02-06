require("dotenv").config();
const express = require("express");
const path = require("path");

// ✅ SHARED DB POOL
const pool = require("./src/config/db");

// Swagger
const swaggerSetup = require("./src/docs/swagger");

// Routes
const rfqRoutes = require("./routes/rfq.routes");
const rfqFiles = require("./routes/rfqFiles.routes");
const quoteRoutes = require("./routes/quote.routes");
const rfqMessagesRoutes = require("./routes/rfqMessage.routes");
const purchaseOrderRoutes = require("./routes/purchaseOrder.routes");
const quoteAcceptanceRoutes = require("./routes/quoteAcceptance.routes");
const authRoutes = require("./routes/auth.routes");

// Middleware
const errorHandler = require("./middleware/errorHandler.middleware");

// Services
const { createUsersFromRequest } = require("./services/userProvisioningService");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===================== SWAGGER ===================== */
swaggerSetup(app);

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ===================== FRONTEND ===================== */
// ✅ Serve frontend FIRST (important)
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dashboard.html"));
});

app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "admin-dashboard.html"));
});

/* ===================== API ROUTES ===================== */
// ✅ APIs AFTER frontend
app.use("/api/auth", authRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/rfq-files", rfqFiles);
app.use("/api/quotes", quoteRoutes);
app.use("/api/quotes", quoteAcceptanceRoutes);
app.use("/api/rfq-messages", rfqMessagesRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);

/* ===================== HEALTH ===================== */
app.get("/api/_health", async (_, res) => {
  try {
    // Server is UP if this endpoint is hit
    let dbStatus = "up";
    let dbTime = null;

    try {
      const r = await pool.query("SELECT NOW()");
      dbTime = r.rows[0].now;
    } catch (dbErr) {
      console.error("❌ DB not reachable:", dbErr.message);
      dbStatus = "down";
    }

    res.json({
      status: "up",        // ✅ SERVER STATUS
      dbStatus,            // ℹ️ DB STATUS
      dbTime,
    });
  } catch (err) {
    res.status(500).json({ status: "down" });
  }
});


/* ===================== ADMIN DASHBOARD APIs ===================== */
app.get("/api/network-request", async (_, res) => {
  const r = await pool.query(
    `SELECT * FROM network_access_requests ORDER BY submission_timestamp DESC`
  );
  res.json({ success: true, data: r.rows });
});

app.post("/api/network-request", async (req, res) => {
  const {
    companyName, website, registeredAddress, cityState,
    contactName, role, email, phone, whatYouDo,
    primaryProduct, keyComponents, manufacturingLocations,
    monthlyCapacity, certifications, roleInEV, whyJoinAXO
  } = req.body;

  const r = await pool.query(
    `INSERT INTO network_access_requests (
      company_name, website, registered_address, city_state,
      contact_name, role, email, phone, what_you_do,
      primary_product, key_components, manufacturing_locations,
      monthly_capacity, certifications, role_in_ev, why_join_axo
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,$16
    ) RETURNING *`,
    [
      companyName,
      website || null,
      registeredAddress || null,
      cityState,
      contactName,
      role,
      email,
      phone,
      JSON.stringify(whatYouDo),
      primaryProduct,
      keyComponents,
      manufacturingLocations,
      monthlyCapacity,
      certifications || null,
      roleInEV,
      whyJoinAXO
    ]
  );

  res.json({ success: true, id: r.rows[0].id });
});

/* ===================== APPROVE / REJECT ===================== */
app.put("/api/network-request/:id/status", async (req, res) => {
  const { status, verificationNotes } = req.body;

  const r = await pool.query(
    `UPDATE network_access_requests
     SET status=$1, verification_notes=$2
     WHERE id=$3
     RETURNING *`,
    [status, verificationNotes || null, req.params.id]
  );

  if (!r.rows.length) {
    return res.status(404).json({ success: false });
  }

  if (status === "verified") {
    await createUsersFromRequest(pool, r.rows[0]);
  }

  res.json({ success: true });
});

/* ===================== ERROR HANDLER (LAST) ===================== */
app.use(errorHandler);

/* ===================== START SERVER ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
