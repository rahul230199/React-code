/* =========================================================
   AXO NETWORKS — AUTHENTICATION MIDDLEWARE (PRODUCTION SAFE)
========================================================= */

const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/* =========================================================
   AUTHENTICATE
========================================================= */

const authenticate = asyncHandler(async (req, res, next) => {

  /* =====================================================
     ENV VALIDATION
  ===================================================== */
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  /* =====================================================
     EXTRACT TOKEN
  ===================================================== */

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Authentication required.", 401);
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AppError("Invalid authorization format.", 401);
  }

  const token = parts[1];

  /* =====================================================
     VERIFY TOKEN
  ===================================================== */

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

  /* =====================================================
     FETCH LATEST USER STATE (SECURITY CRITICAL)
  ===================================================== */

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

  /* =====================================================
     ACCOUNT STATUS CHECK
  ===================================================== */

  if (user.status !== "active") {
    throw new AppError("Account is not active.", 403);
  }

  /* =====================================================
     FORCE PASSWORD CHANGE
  ===================================================== */

 const allowedDuringPasswordChange = [
  "/api/auth/change-password",
  "/api/buyer/purchase-orders", // allow viewing orders
];

const isAllowedRoute = allowedDuringPasswordChange.some(route =>
  req.originalUrl.startsWith(route)
);

if (user.must_change_password === true && !isAllowedRoute) {
  throw new AppError(
    "Password change required before accessing the system.",
    403
  );
}

  /* =====================================================
     ATTACH SECURE USER OBJECT
  ===================================================== */

  req.user = {
    id: user.id,
    role: user.role,
    organization_id: user.organization_id,
  };

  next();

});

module.exports = { authenticate };