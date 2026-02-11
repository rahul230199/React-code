const bcrypt = require("bcrypt");

/**
 * Creates local-only buyer & seller users.
 * Runs ONLY when NODE_ENV=local
 */
async function createLocalUsers(pool) {
  console.log("🧪 Checking local test users...");

  const users = [
    {
      email: "buyer@local.test",
      password: "Buyer@123",
      role: "buyer",
    },
    {
      email: "seller@local.test",
      password: "Seller@123",
      role: "seller",
    },
  ];

  for (const user of users) {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [user.email]
    );

    if (existing.rows.length > 0) {
      console.log(`ℹ️ User already exists: ${user.email}`);
      continue;
    }

    const hash = await bcrypt.hash(user.password, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, $3, 'active')`,
      [user.email, hash, user.role]
    );

    console.log(`✅ Local user created: ${user.email}`);
  }
}

module.exports = { createLocalUsers };
