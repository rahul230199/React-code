const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../src/config/db");

const router = express.Router();

console.log("✅ auth.routes.js loaded");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

/* ================= TOKEN HELPERS ================= */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "14d" });
}

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, role, status
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account inactive"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role
    });

    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

/* ================= REFRESH TOKEN ================= */
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token required"
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role
    });

    res.json({
      success: true,
      token: newAccessToken
    });
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
});

module.exports = router;

