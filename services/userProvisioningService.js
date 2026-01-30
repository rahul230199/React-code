const bcrypt = require("bcrypt");

function baseUsername(email) {
  return email.split("@")[0].toLowerCase();
}

function systemEmail(username, role) {
  return `${username}.${role}@axonetworks.com`;
}

function systemUsername(username, role) {
  return `${username}_${role}`;
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-10);
}

async function createUsersFromRequest(pool, request) {
  if (!request || !request.email) {
    throw new Error("Invalid request data");
  }

  const base = baseUsername(request.email);

  let roles = [];
  if (request.role_in_ev === "Issue POs") roles = ["buyer"];
  if (request.role_in_ev === "Fulfil POs") roles = ["supplier"];
  if (request.role_in_ev === "Both") roles = ["buyer", "supplier"];

  for (const role of roles) {
    const email = systemEmail(base, role);
    const username = systemUsername(base, role);

    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (exists.rows.length) {
      console.log(`⚠️ User exists: ${email}`);
      continue;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `INSERT INTO users (
        network_request_id,
        email,
        username,
        password_hash,
        role
      ) VALUES ($1,$2,$3,$4,$5)`,
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
    console.log("   Username:", username);
    console.log("   Role:", role);
    console.log("   TEMP PASSWORD:", tempPassword);
  }
}

module.exports = { createUsersFromRequest };

