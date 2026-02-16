const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/* =========================================================
   AUTHENTICATE MIDDLEWARE (HARDENED)
========================================================= */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔎 Get latest must_change_password from DB
    const result = await pool.query(
      `SELECT must_change_password FROM public.users WHERE id = $1`,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const mustChange = result.rows[0].must_change_password;

    // 🚫 Block all routes except change-password
    if (
      mustChange === true &&
      !req.originalUrl.includes("/api/auth/change-password")
    ) {
      return res.status(403).json({
        success: false,
        message: "Password change required before accessing system.",
      });
    }

    req.user = decoded; // { id, role, organization_id }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

module.exports = { authenticate };