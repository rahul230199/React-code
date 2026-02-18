/* =========================================================
   AXO NETWORKS — AUTH CONTROLLER (ENTERPRISE)
========================================================= */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");

/* =========================================================
   LOGIN
========================================================= */

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password required", 400, {
      errorCode: "AUTH_MISSING_CREDENTIALS",
    });
  }

  const result = await pool.query(
    `
    SELECT id, email, password_hash, role,
           status, must_change_password,
           organization_id
    FROM public.users
    WHERE email = $1
    `,
    [email.toLowerCase().trim()]
  );

  if (result.rowCount === 0) {
    throw new AppError("Invalid credentials", 401, {
      errorCode: "AUTH_INVALID_CREDENTIALS",
    });
  }

  const user = result.rows[0];

  if (user.status !== "active") {
    throw new AppError("Account is inactive", 403, {
      errorCode: "AUTH_ACCOUNT_INACTIVE",
    });
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    throw new AppError("Invalid credentials", 401, {
      errorCode: "AUTH_INVALID_CREDENTIALS",
    });
  }

  /* =========================================================
     JWT WITH ISSUER + AUDIENCE (Required by auth.middleware)
  ========================================================= */

  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
      issuer: "axo-networks",
      audience: "axo-users",
    }
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token: accessToken,
      must_change_password: user.must_change_password,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
      },
    },
  });
});

/* =========================================================
   FORCE CHANGE PASSWORD
========================================================= */

exports.changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { newPassword } = req.body;

  if (!userId) {
    throw new AppError("Unauthorized", 401, {
      errorCode: "AUTH_UNAUTHORIZED",
    });
  }

  if (!newPassword || newPassword.length < 8) {
    throw new AppError(
      "Password must be at least 8 characters",
      400,
      { errorCode: "AUTH_WEAK_PASSWORD" }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const result = await pool.query(
    `
    UPDATE public.users
    SET password_hash = $1,
        must_change_password = false
    WHERE id = $2
    RETURNING id
    `,
    [hashedPassword, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError("User not found", 404, {
      errorCode: "AUTH_USER_NOT_FOUND",
    });
  }

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
