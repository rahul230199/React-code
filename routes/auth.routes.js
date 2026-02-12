const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../src/config/db");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

console.log("✅ auth.routes.js loaded");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

/* =======================================================
   TOKEN HELPERS
======================================================= */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "14d" });
}

/* =======================================================
   LOGIN
======================================================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    email = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, email, password_hash, role, status, must_change_password
       FROM users
       WHERE email = $1`,
      [email]
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

    const normalizedRole = user.role.toLowerCase();

    const accessToken = generateAccessToken({
      userId: user.id,
      role: normalizedRole
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: normalizedRole
    });

    /* =======================================================
       🔐 FORCE PASSWORD CHANGE LOGIC
    ======================================================= */
    if (user.must_change_password) {
      return res.json({
        success: true,
        mustChangePassword: true,
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: normalizedRole
        }
      });
    }

    /* =======================================================
       NORMAL LOGIN
    ======================================================= */
    res.json({
      success: true,
      mustChangePassword: false,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: normalizedRole
      }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

/* =======================================================
   CHANGE PASSWORD (FORCED OR NORMAL)
======================================================= */
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           must_change_password = false
       WHERE id = $2`,
      [hash, req.user.userId]
    );

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("❌ CHANGE PASSWORD ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update password"
    });
  }
});

/* =======================================================
   REFRESH TOKEN
======================================================= */
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
