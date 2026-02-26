/* =========================================================
   AXO NETWORKS — AUTHENTICATION MIDDLEWARE (HARDENED)
========================================================= */

const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/* =========================================================
   AUTHENTICATE
========================================================= */

const authenticate = asyncHandler(async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Authentication required.", 401);
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AppError("Invalid authorization format.", 401);
  }

  const token = parts[1];

  let decoded;

  try {

    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "axo-networks",
      audience: "axo-users",
    });

  } catch {
    throw new AppError("Session expired. Please login again.", 401);
  }

  if (!decoded || !decoded.id) {
    throw new AppError("Invalid token payload.", 401);
  }

  /* =====================================================
     FETCH LATEST USER STATE
  ====================================================== */

  const result = await pool.query(
    `
    SELECT id, role, organization_id,
           must_change_password, status
    FROM public.users
    WHERE id = $1
    `,
    [decoded.id]
  );

  if (!result.rowCount) {
    throw new AppError("User not found.", 401);
  }

  const user = result.rows[0];

  if (user.status !== "active") {
    throw new AppError("Account is not active.", 403);
  }

  /* =====================================================
     FORCE PASSWORD CHANGE (STRICT)
  ====================================================== */

  const passwordChangeRoute = "/api/auth/change-password";

  if (
    user.must_change_password === true &&
    !req.originalUrl.startsWith(passwordChangeRoute)
  ) {
    throw new AppError(
      "Password change required before accessing the system.",
      403
    );
  }

  /* =====================================================
     ATTACH SECURE USER OBJECT
  ====================================================== */

  req.user = {
    id: user.id,
    role: user.role,
    organization_id: user.organization_id,
  };

  next();

});

module.exports = { authenticate };