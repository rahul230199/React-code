const bcrypt = require("bcrypt");
const { sendCredentialsEmail, generateTemporaryPassword } =
  require("./emailService");

function baseUsername(email) {
  return email.split("@")[0].toLowerCase();
}

async function createUserFromRequest(pool, request) {
  if (!request || !request.email || !request.role_in_ev) {
    throw new Error("Invalid network request data");
  }

  let role;

  if (request.role_in_ev === "OEMs") role = "buyer";
  else if (request.role_in_ev === "Supplier") role = "supplier";
  else if (request.role_in_ev === "Both") role = "both";
  else throw new Error("Invalid role mapping");

  const email = request.email.toLowerCase();
  const username = baseUsername(email);

  // Check existing
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length) {
    console.log("User already exists:", email);
    return;
  }

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await pool.query(
    `INSERT INTO users (
      network_request_id,
      email,
      username,
      password_hash,
      role,
      status,
      must_change_password
    )
    VALUES ($1,$2,$3,$4,$5,'active',true)`,
    [
      request.id,
      email,
      username,
      passwordHash,
      role
    ]
  );

  await sendCredentialsEmail(email, username, tempPassword, role);

  console.log("✅ USER CREATED:", email);
}

module.exports = { createUserFromRequest };
