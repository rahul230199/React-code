require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./src/config/db");

const { createUsersFromRequest } = require("./services/userProvisioningService");

// Routes
const authRoutes = require("./routes/auth.routes");
const rfqRoutes = require("./routes/rfq.routes");
const rfqFilesRoutes = require("./routes/rfqFiles.routes");
const quoteRoutes = require("./routes/quote.routes");
const quoteAcceptanceRoutes = require("./routes/quoteAcceptance.routes");
const rfqMessageRoutes = require("./routes/rfqMessage.routes");
const purchaseOrderRoutes = require("./routes/purchaseOrder.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* =========================================================
   CORS
========================================================= */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* =========================================================
   STATIC FRONTEND
========================================================= */
app.use(express.static(path.join(__dirname, "frontend")));

/* =========================================================
   API ROUTES (MUST COME BEFORE 404 HANDLER)
========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/rfq-files", rfqFilesRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/quotes", quoteAcceptanceRoutes);
app.use("/api/rfq-messages", rfqMessageRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);

/* =========================================================
   HEALTH
========================================================= */
app.get("/api/_health", async (_, res) => {
  try {
    const r = await pool.query("SELECT NOW()");
    res.json({ success: true, dbTime: r.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* =========================================================
   NETWORK ACCESS
========================================================= */

// GET – Admin Dashboard
app.get("/api/network-request", async (_, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM network_access_requests
       ORDER BY submission_timestamp DESC`
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ success: false });
  }
});

// GET single request
app.get("/api/network-request/:id", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM network_access_requests WHERE id=$1",
      [req.params.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// POST – Public Form
app.post("/api/network-request", async (req, res) => {
  try {
    const {
      companyName,
      website,
      registeredAddress,
      cityState,
      contactName,
      role,
      email,
      phone,
      whatYouDo,
      primaryProduct,
      keyComponents,
      manufacturingLocations,
      monthlyCapacity,
      certifications,
      roleInEV,
      whyJoinAXO
    } = req.body;

    const r = await pool.query(
      `INSERT INTO network_access_requests (
        company_name,
        website,
        registered_address,
        city_state,
        contact_name,
        role,
        email,
        phone,
        what_you_do,
        primary_product,
        key_components,
        manufacturing_locations,
        monthly_capacity,
        certifications,
        role_in_ev,
        why_join_axo
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16
      ) RETURNING id`,
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
  } catch (err) {
    console.error("❌ Insert error:", err.message);
    res.status(500).json({
      success: false,
      message: "Submission failed"
    });
  }
});

/* =========================================================
   APPROVE / REJECT (THIS MUST BE ABOVE 404)
========================================================= */

app.put("/api/network-request/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, verificationNotes } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  try {
    const r = await pool.query(
      `UPDATE network_access_requests
       SET status=$1,
           verification_notes=$2
       WHERE id=$3
       RETURNING *`,
      [status, verificationNotes || null, id]
    );

    if (!r.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    // 🔥 PROVISION USER WHEN APPROVED
    if (status === "verified") {
      await createUsersFromRequest(pool, r.rows[0]);
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Status update error:", err.message);
    res.status(500).json({
      success: false,
      message: "Status update failed"
    });
  }
});

/* =========================================================
   FINAL API FALLBACK (MUST BE LAST)
========================================================= */
app.use("/api", (_, res) => {
  res.status(404).json({
    success: false,
    message: "Invalid API route"
  });
});

/* =========================================================
   START SERVER
========================================================= */
app.listen(PORT, () => {
  console.log(`🚀 AXO API running on port ${PORT}`);
});

