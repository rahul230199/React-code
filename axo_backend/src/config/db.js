const { Pool } = require("pg");

console.log("🔌 Connecting to DB...");
console.log("   Host:", process.env.DB_HOST);
console.log("   Database:", process.env.DB_NAME);
console.log("   User:", process.env.DB_USER);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
});

pool
  .connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL:", process.env.DB_NAME);
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err.message);
  });

module.exports = pool;