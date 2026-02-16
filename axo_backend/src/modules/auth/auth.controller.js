const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");

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
   LOGIN (All Roles)
========================================================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, false, "Email and password required");
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, role, status,
              must_change_password, organization_id
       FROM public.users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const user = result.rows[0];

    // 🚫 Block inactive users
    if (user.status !== "active") {
      return sendResponse(res, 403, false, "Account is inactive");
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    // 🔐 Create JWT
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        organization_id: user.organization_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return sendResponse(res, 200, true, "Login successful", {
      token: accessToken,
      must_change_password: user.must_change_password,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
};