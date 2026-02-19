/* =========================================================
   AXO NETWORKS — AUTHENTICATION MIDDLEWARE (ENTERPRISE)
========================================================= */

const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/* =========================================================
   AUTHENTICATE USER
========================================================= */

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Access denied. No token provided.", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], // Restrict algorithm
      issuer: "axo-networks",
      audience: "axo-users",
    });
  } catch (err) {
    throw new AppError("Invalid or expired token.", 401);
  }

  /* =========================================================
     FETCH LATEST USER STATE FROM DB (SECURITY CRITICAL)
  ========================================================= */

  const result = await pool.query(
    `
    SELECT id, role, organization_id, must_change_password, status
    FROM public.users
    WHERE id = $1
    `,
    [decoded.id]
  );

  if (result.rowCount === 0) {
    throw new AppError("User not found.", 401);
  }

  const user = result.rows[0];

  /* =========================================================
     ACCOUNT STATUS CHECK
  ========================================================= */

  if (user.status !== "active") {
    throw new AppError("Account is deactivated. Contact admin.", 403);
  }

  /* =========================================================
     FORCE PASSWORD CHANGE LOGIC
  ========================================================= */

  if (
    user.must_change_password === true &&
    !req.originalUrl.includes("/api/auth/change-password")
  ) {
    throw new AppError(
      "Password change required before accessing system.",
      403
    );
  }

  /* =========================================================
     ATTACH SECURE USER OBJECT
     (Never trust token role blindly)
  ========================================================= */

  req.user = {
    id: user.id,
    role: user.role,
    organization_id: user.organization_id,
  };

  next();
});

module.exports = { authenticate };
