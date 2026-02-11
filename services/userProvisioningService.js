const bcrypt = require("bcrypt");

/**
 * Extract base username from email
 * e.g. rahul.sv@axonetworks.com → rahul.sv
 */
function baseUsername(email) {
  return email.split("@")[0].toLowerCase();
}

/**
 * Generate temporary password (DEV / onboarding use)
 */
function generateTempPassword() {
  return Math.random().toString(36).slice(-10);
}

/**
 * Create ONE user from network request
 * Role mapping:
 *  OEMs     → buyer
 *  Supplier → supplier
 *  Both     → both
 */
async function createUsersFromRequest(pool, request) {
  if (!request || !request.email || !request.role_in_ev) {
    throw new Error("Invalid network request data");
  }

  // 🔁 Map form selection → system role
  let role;
  if (request.role_in_ev === "OEMs") {
    role = "buyer";
  } else if (request.role_in_ev === "Supplier") {
    role = "supplier";
  } else if (request.role_in_ev === "Both") {
    role = "both";
  } else {
    throw new Error(`Unknown role_in_ev value: ${request.role_in_ev}`);
  }

  const email = request.email.toLowerCase();
  const username = baseUsername(email);

  // 🔍 Check if user already exists
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length) {
    console.log("⚠️ User already exists, skipping creation:", email);
    return;
  }

  // 🔐 Create password
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // ✅ Insert ONE user
  await pool.query(
    `INSERT INTO users (
      network_request_id,
      email,
      username,
      password_hash,
      role
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      request.id,
      email,
      username,
      passwordHash,
      role
    ]
  );

  console.log("✅ USER CREATED");
  console.log("   Email:", email);
  console.log("   Role:", role);
  console.log("   TEMP PASSWORD:", tempPassword); // ❗ REMOVE IN PROD
}

module.exports = { createUsersFromRequest };

