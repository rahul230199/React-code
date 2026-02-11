// services/AuthService.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

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
     ADMIN LOGIN (STATIC FOR NOW)
  ========================================= */
  async adminLogin(email, password) {
    if (
      email === "admin@axonetworks.com" &&
      password === "admin123"
    ) {
      const token = jwt.sign(
        { email, role: "admin" },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      return {
        success: true,
        token,
        user: {
          email,
          role: "admin",
          userType: "admin"
        }
      };
    }
    return null;
  },

  /* =========================================
     USER LOGIN (DB USERS TABLE)
  ========================================= */
  async userLogin(email, password) {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND status='active'",
      [email]
    );

    if (!result.rows.length) {
      return { success: false, message: "User not found" };
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return { success: false, message: "Invalid password" };
    }

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
  },

  /* =========================================
     VERIFY TOKEN
  ========================================= */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { authenticated: true, decoded };
    } catch {
      return { authenticated: false };
    }
  },

  /* =========================================
     PROFILE
  ========================================= */
  async getProfile(userId) {
    const r = await pool.query(
      "SELECT id,email,role,status FROM users WHERE id=$1",
      [userId]
    );
    if (!r.rows.length) return { success: false };
    return { success: true, user: r.rows[0] };
  }
};

