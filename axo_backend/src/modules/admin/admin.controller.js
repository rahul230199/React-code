const pool = require("../../config/db");
const bcrypt = require("bcrypt");

/* =========================================================
   HELPER RESPONSE FORMAT
========================================================= */
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};

/* =========================================================
   GET ALL USERS
========================================================= */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT id, email, username, role, status,
             must_change_password, created_at, organization_id
      FROM public.users
    `;

    const values = [];

    if (role) {
      query += ` WHERE role = $1`;
      values.push(role);
    }

    query += ` ORDER BY id ASC`;

    const { rows } = await pool.query(query, values);

    return sendResponse(res, 200, true, "Users fetched successfully", rows);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/* =========================================================
   UPDATE USER STATUS
========================================================= */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value");
    }

    const result = await pool.query(
      `UPDATE public.users
       SET status = $1
       WHERE id = $2
       RETURNING id, email, role, status`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, 404, false, "User not found");
    }

    return sendResponse(res, 200, true, "User updated", result.rows[0]);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/* =========================================================
   PLATFORM STATS
========================================================= */
exports.getPlatformStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'buyer') AS total_buyers,
        COUNT(*) FILTER (WHERE role = 'supplier') AS total_suppliers,
        COUNT(*) FILTER (WHERE role = 'oem') AS total_oems,
        COUNT(*) FILTER (WHERE role = 'admin') AS total_admins
      FROM public.users
    `);

    return sendResponse(res, 200, true, "Stats fetched", result.rows[0]);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/* =========================================================
   GET ALL NETWORK ACCESS REQUESTS
========================================================= */
exports.getAllNetworkAccessRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM public.network_access_requests
      ORDER BY created_at DESC
    `);

    return sendResponse(res, 200, true, "Network access requests fetched successfully", result.rows);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};


/* =========================================================
   APPROVE NETWORK ACCESS REQUEST (WITH ORGANIZATION)
   Production Safe Version
========================================================= */
exports.approveNetworkRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // 🔒 Lock request row
    const requestResult = await client.query(
      `SELECT * FROM public.network_access_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (requestResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Request not found");
    }

    const request = requestResult.rows[0];

    if (request.status !== "pending") {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Request already processed");
    }

    /* =====================================================
       DUPLICATE CHECK (EMAIL + PHONE)
    ===================================================== */

    const duplicateUser = await client.query(
      `SELECT id FROM public.users
       WHERE email = $1 OR phone = $2`,
      [request.email, request.phone]
    );

    if (duplicateUser.rowCount > 0) {
      await client.query("ROLLBACK");
      return sendResponse(
        res,
        400,
        false,
        "User already exists with same email or phone"
      );
    }

    /* =====================================================
       CREATE ORGANIZATION
    ===================================================== */

    const orgResult = await client.query(
      `INSERT INTO public.organizations (
        company_name,
        role_type,
        city_state,
        primary_product,
        monthly_capacity,
        status,
        created_at,
        verified_at,
        verified_by
      )
      VALUES ($1,$2,$3,$4,$5,'active',NOW(),NOW(),$6)
      RETURNING id`,
      [
        request.company_name,
        request.role_requested,
        request.city_state,
        request.primary_product,
        request.monthly_capacity,
        req.user.id
      ]
    );

    const organizationId = orgResult.rows[0].id;

    /* =====================================================
       CREATE USER (INCLUDING PHONE)
    ===================================================== */

    const tempPassword = "ChangeMe@123";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userResult = await client.query(
      `INSERT INTO public.users (
        email,
        username,
        password_hash,
        role,
        status,
        must_change_password,
        phone,
        network_request_id,
        organization_id,
        created_at
      )
      VALUES ($1,$2,$3,$4,'active',true,$5,$6,$7,NOW())
      RETURNING id, email, role, status`,
      [
        request.email.toLowerCase(),
        request.email.split("@")[0],
        passwordHash,
        request.role_requested,
        request.phone,
        request.id,
        organizationId
      ]
    );

    /* =====================================================
       UPDATE REQUEST STATUS
    ===================================================== */

    await client.query(
      `UPDATE public.network_access_requests
       SET status = 'approved'
       WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return sendResponse(res, 200, true, "Request approved successfully", {
      organization_id: organizationId,
      user: userResult.rows[0],
      temporary_password: tempPassword
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Approval Error:", error);
    return sendResponse(res, 500, false, error.message);
  } finally {
    client.release();
  }
};

/* =========================================================
   REJECT REQUEST
========================================================= */
exports.rejectNetworkRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE public.network_access_requests
       SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, 400, false, "Request not found or already processed");
    }

    return sendResponse(res, 200, true, "Request rejected successfully");
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};