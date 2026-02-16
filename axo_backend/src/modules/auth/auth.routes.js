const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");
const { authenticate } = require("../../middlewares/auth.middleware");

const router = express.Router();

/* =========================================================
   HELPER RESPONSE FORMAT
========================================================= */
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};

/* =========================================================
   LOGIN
========================================================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, false, "Email and password required");
    }

    email = email.toLowerCase().trim();

    const result = await pool.query(
      `SELECT id, email, password_hash, role,
              status, must_change_password,
              organization_id
       FROM public.users
       WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return sendResponse(res, 403, false, "Account is inactive");
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        organization_id: user.organization_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return sendResponse(res, 200, true, "Login successful", {
      token,
      must_change_password: user.must_change_password,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
});


/* =========================================================
   FORCE CHANGE PASSWORD (NO OLD PASSWORD REQUIRED)
========================================================= */
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return sendResponse(res, 400, false, "New password required");
    }

    if (newPassword.length < 8) {
      return sendResponse(res, 400, false, "Password must be at least 8 characters");
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE public.users
       SET password_hash = $1,
           must_change_password = false
       WHERE id = $2`,
      [newHash, userId]
    );

    return sendResponse(res, 200, true, "Password changed successfully");

  } catch (error) {
    console.error("❌ Change password error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
});

module.exports = router;