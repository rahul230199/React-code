const { Pool } = require("pg");

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_SSL:", process.env.DB_SSL);

const isSSL = process.env.DB_SSL === "true";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: isSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ✅ DO NOT KILL SERVER
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected at:", res.rows[0].now);
  } catch (err) {
    console.error("⚠️ PostgreSQL connection failed (server will still run)");
    console.error(err.message);
  }
})();

pool.on("connect", () => {
  console.log("🔌 New PostgreSQL client connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
  // ❌ NO process.exit here
});

module.exports = pool;
