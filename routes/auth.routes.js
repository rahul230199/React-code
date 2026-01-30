const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

console.log("✅ auth.routes.js LOADED");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "axo-secret";

/* ======================================================
   DB CONNECTION
====================================================== */
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "axo_networks",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  port: process.env.PGPORT || 5432,
});

/* ======================================================
   LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 LOGIN ATTEMPT:", email);

    /* =========================
       HARD-CODED ADMIN LOGIN
    ========================== */
    if (email.toLowerCase() === "admin@axonetworks.com") {
      if (password !== "Admin@123") {
        return res.status(401).json({
          success: false,
          message: "Invalid admin password"
        });
      }

      const token = jwt.sign(
        { role: "admin", email },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        success: true,
        token,
        user: {
          email,
          role: "admin"
        }
      });
    }

    /* =========================
       NORMAL USER LOGIN
    ========================== */
    const userRes = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND status='active'",
      [email]
    );

    if (!userRes.rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = userRes.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;

