const bcrypt = require("bcrypt");
const {
  sendCredentialsEmail,
  sendApprovalNotification,
  generateTemporaryPassword
} = require("./emailService");

/* =========================================================
   ROLE MAPPING
========================================================= */
function mapRole(roleInEV) {
  if (roleInEV === "OEMs") return "buyer";
  if (roleInEV === "Supplier" || roleInEV === "Suppliers") return "supplier";
  if (roleInEV === "Both") return "both";
  throw new Error("Invalid role mapping");
}

function baseUsername(email) {
  return email.split("@")[0].toLowerCase();
}

/* =========================================================
   ENTERPRISE USER PROVISIONING (SAFE VERSION)
========================================================= */
async function createUserFromRequest(pool, request) {

  if (!request || !request.email || !request.role_in_ev) {
    throw new Error("Invalid network request data");
  }

  const client = await pool.connect();

  let email;
  let username;
  let role;
  let userId;
  let tempPassword = null;
  let isNewUser = false;

  try {
    await client.query("BEGIN");

    email = request.email.toLowerCase();
    role = mapRole(request.role_in_ev);
    username = baseUsername(email);

    // 🔒 Lock row to avoid race condition
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1 FOR UPDATE",
      [email]
    );

    if (existingUser.rows.length) {

      userId = existingUser.rows[0].id;
      console.log("⚠️ User already exists:", email);

    } else {

      tempPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const insertUser = await client.query(
        `INSERT INTO users (
          network_request_id,
          email,
          username,
          password_hash,
          role,
          status,
          must_change_password
        )
        VALUES ($1,$2,$3,$4,$5,'active',true)
        RETURNING id`,
        [
          request.id,
          email,
          username,
          passwordHash,
          role
        ]
      );

      userId = insertUser.rows[0].id;
      isNewUser = true;

      console.log("✅ New user created:", email);
    }

    // 🔗 Link request to user
    await client.query(
      `UPDATE network_access_requests
       SET user_id = $1
       WHERE id = $2`,
      [userId, request.id]
    );

    await client.query("COMMIT");

  } catch (err) {

    await client.query("ROLLBACK");
    console.error("User provisioning failed:", err);
    throw err;

  } finally {
    client.release();
  }

  /* =========================================================
     SEND EMAIL AFTER COMMIT (VERY IMPORTANT)
  ========================================================= */

  try {

    if (isNewUser) {
      await sendCredentialsEmail(email, username, tempPassword, role);
    } else {
      await sendApprovalNotification(email);
    }

  } catch (emailErr) {
    console.error("Email sending failed:", emailErr);
    // DO NOT throw — DB already committed safely
  }

  return {
    success: true,
    userId,
    isNewUser
  };
}

module.exports = { createUserFromRequest };