// services/PasswordResetService.js
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "axo_networks",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  port: process.env.PGPORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || "axo-secret";

module.exports = {
  /* =========================================
     FORCE PASSWORD RESET (FIRST LOGIN)
  ========================================= */
  async forceResetPassword(email, newPassword) {
    // Check user exists
    const userRes = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!userRes.rows.length) {
      return { success: false, message: "User not found" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password_hash=$1, status='active'
       WHERE email=$2`,
      [passwordHash, email]
    );

    const user = userRes.rows[0];

    // Issue new token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        userType: user.role
      }
    };
  }
};

