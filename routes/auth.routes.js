const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ✅ CORRECT DB IMPORT (FIXED)
const pool = require("../src/config/db");

console.log("✅ auth.routes.js LOADED");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "axo-secret";

/* ======================================================
   LOGIN (FUNCTIONALITY UNCHANGED)
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 LOGIN ATTEMPT:", email);

    /* =========================
       ADMIN LOGIN (UNCHANGED)
    ========================== */
    if (email && email.toLowerCase() === "admin@axonetworks.com") {
      if (password !== "Admin@123") {
        return res.status(401).json({
          success: false,
          message: "Invalid admin password",
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
          role: "admin",
        },
      });
    }

    /* =========================
       NORMAL USER LOGIN
    ========================== */
    const userRes = await pool.query(
      "SELECT id, email, password_hash, role, status FROM users WHERE email=$1",
      [email]
    );

    if (!userRes.rows.length || userRes.rows[0].status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userRes.rows[0];

    if (!user.password_hash) {
      console.error("❌ password_hash missing for user:", email);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
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
        role: user.role,
      },
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    console.error(err.stack);

    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

module.exports = router;
