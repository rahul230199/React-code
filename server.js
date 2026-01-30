require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const authRoutes = require("./routes/auth.routes");
const { createUsersFromRequest } = require("./services/userProvisioningService");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===================== DB ===================== */
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "axo_networks",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  port: process.env.PGPORT || 5432,
});

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);

/* ===================== HEALTH ===================== */
app.get("/api/_health", async (_, res) => {
  const r = await pool.query("SELECT NOW()");
  res.json({ status: "up", dbTime: r.rows[0].now });
});

/* ===================== ADMIN DASHBOARD ===================== */
app.get("/api/network-request", async (_, res) => {
  const r = await pool.query(
    `SELECT * FROM network_access_requests ORDER BY submission_timestamp DESC`
  );
  res.json({ success: true, data: r.rows });
});

/* ===================== FORM SUBMIT ===================== */
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

/* ===================== START ===================== */
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

