/* =========================================================
   AXO NETWORKS — ADMIN CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const bcrypt = require("bcrypt");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");
const { logAdminAction } = require("../../utils/auditLogger");

/* =========================================================
   GET ALL USERS
========================================================= */
exports.getAllUsers = asyncHandler(async (req, res) => {
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

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: rows,
  });
});

/* =========================================================
   UPDATE USER STATUS
========================================================= */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    throw new AppError("Invalid status value", 400, {
      errorCode: "ADMIN_INVALID_STATUS",
    });
  }

  const result = await pool.query(
    `
    UPDATE public.users
    SET status = $1
    WHERE id = $2
    RETURNING id, email, role, status
    `,
    [status, id]
  );

  if (result.rowCount === 0) {
    throw new AppError("User not found", 404, {
      errorCode: "ADMIN_USER_NOT_FOUND",
    });
  }

  await logAdminAction({
  adminUserId: req.user.id,
  actionType: "USER_STATUS_UPDATED",
  targetTable: "users",
  targetId: id,
  metadata: { new_status: status }
});

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: result.rows[0],
  });
});

/* =========================================================
   RESET USER PASSWORD
========================================================= */
exports.resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tempPassword = "AXO@" + Math.random().toString(36).slice(-6);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const result = await pool.query(
    `
    UPDATE public.users
    SET password_hash = $1,
        must_change_password = true
    WHERE id = $2
    RETURNING id, email, role
    `,
    [passwordHash, id]
  );

  if (result.rowCount === 0) {
    throw new AppError("User not found", 404, {
      errorCode: "ADMIN_USER_NOT_FOUND",
    });
  }

  await logAdminAction({
  adminUserId: req.user.id,
  actionType: "USER_PASSWORD_RESET",
  targetTable: "users",
  targetId: id
});

  res.status(200).json({
    success: true,
    message: "Password reset successful",
    data: {
      user: result.rows[0],
      temporary_password: tempPassword,
    },
  });
});

/* =========================================================
   PLATFORM STATS
========================================================= */
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE role = 'buyer') AS total_buyers,
      COUNT(*) FILTER (WHERE role = 'supplier') AS total_suppliers,
      COUNT(*) FILTER (WHERE role = 'oem') AS total_oems,
      COUNT(*) FILTER (WHERE role = 'admin') AS total_admins
    FROM public.users
  `);

  res.status(200).json({
    success: true,
    message: "Stats fetched successfully",
    data: result.rows[0],
  });
});

/* =========================================================
   GET ALL NETWORK ACCESS REQUESTS
========================================================= */
exports.getAllNetworkAccessRequests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    start_date,
    end_date,
  } = req.query;

  const numericPage = Number(page);
  const numericLimit = Number(limit);
  const offset = (numericPage - 1) * numericLimit;

  let whereClause = [];
  let values = [];
  let index = 1;

  if (status && status !== "ALL") {
    whereClause.push(`status = $${index}`);
    values.push(status.toLowerCase());
    index++;
  }

  if (search) {
    whereClause.push(`
      (
        company_name ILIKE $${index}
        OR email ILIKE $${index}
        OR contact_name ILIKE $${index}
      )
    `);
    values.push(`%${search}%`);
    index++;
  }

  if (start_date) {
    whereClause.push(`created_at >= $${index}`);
    values.push(start_date);
    index++;
  }

  if (end_date) {
    whereClause.push(`created_at <= $${index}`);
    values.push(end_date);
    index++;
  }

  const whereSQL =
    whereClause.length > 0
      ? `WHERE ${whereClause.join(" AND ")}`
      : "";

  // Total Count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM public.network_access_requests ${whereSQL}`,
    values
  );

  const totalRecords = Number(countResult.rows[0].count);

  // Data Query
  const result = await pool.query(
    `
    SELECT *
    FROM public.network_access_requests
    ${whereSQL}
    ORDER BY created_at DESC
    LIMIT $${index}
    OFFSET $${index + 1}
    `,
    [...values, numericLimit, offset]
  );

  res.status(200).json({
    success: true,
    message: "Network access requests fetched successfully",
    data: {
      total_records: totalRecords,
      current_page: numericPage,
      total_pages: Math.ceil(totalRecords / numericLimit),
      requests: result.rows,
    },
  });
});
/* =========================================================
   APPROVE NETWORK REQUEST (TRANSACTION SAFE)
========================================================= */
exports.approveNetworkRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    throw new AppError("Verification comment required", 400, {
      errorCode: "ADMIN_COMMENT_REQUIRED",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT * FROM public.network_access_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (requestResult.rowCount === 0) {
      throw new AppError("Request not found", 404);
    }

    const request = requestResult.rows[0];

    if (request.status !== "pending") {
      throw new AppError("Request already processed", 400);
    }

    const duplicateUser = await client.query(
      `SELECT id FROM public.users
       WHERE email = $1 OR phone = $2`,
      [request.email, request.phone]
    );

    if (duplicateUser.rowCount > 0) {
      throw new AppError(
        "User already exists with same email or phone",
        400
      );
    }

    const orgResult = await client.query(
      `INSERT INTO public.organizations
       (company_name, role_type, city_state,
        primary_product, monthly_capacity,
        status, created_at, verified_at, verified_by)
       VALUES ($1,$2,$3,$4,$5,'active',NOW(),NOW(),$6)
       RETURNING id`,
      [
        request.company_name,
        request.role_requested,
        request.city_state,
        request.primary_product,
        request.monthly_capacity,
        req.user.id,
      ]
    );

    const organizationId = orgResult.rows[0].id;

    let systemRole = request.role_requested?.toLowerCase();
    if (systemRole === "oem") systemRole = "buyer";
    if (!["buyer", "supplier", "admin"].includes(systemRole)) {
      systemRole = "supplier";
    }

    const tempPassword =
      "AXO@" + Math.random().toString(36).slice(-6);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const userResult = await client.query(
      `INSERT INTO public.users
       (email, username, password_hash, role,
        status, must_change_password,
        phone, network_request_id,
        organization_id, created_at)
       VALUES ($1,$2,$3,$4,'active',true,$5,$6,$7,NOW())
       RETURNING id, email, role, status`,
      [
        request.email.toLowerCase(),
        request.email.split("@")[0],
        passwordHash,
        systemRole,
        request.phone,
        request.id,
        organizationId,
      ]
    );

    await client.query(
      `UPDATE public.network_access_requests
       SET status = 'approved',
           verification_notes = $1
       WHERE id = $2`,
      [comment, id]
    );

    await client.query("COMMIT");

    await logAdminAction({
  adminUserId: req.user.id,
  actionType: "NETWORK_REQUEST_APPROVED",
  targetTable: "network_access_requests",
  targetId: id,
  metadata: { email: request.email }
});

    res.status(200).json({
      success: true,
      message: "Request approved successfully",
      data: {
        organization_id: organizationId,
        user: userResult.rows[0],
        temporary_password: tempPassword,
      },
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
exports.rejectNetworkRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    throw new AppError("Rejection comment required", 400);
  }

  const result = await pool.query(
    `UPDATE public.network_access_requests
     SET status = 'rejected',
         verification_notes = $1
     WHERE id = $2 AND status = 'pending'
     RETURNING id`,
    [comment, id]
  );

  if (result.rowCount === 0) {
    throw new AppError(
      "Request not found or already processed",
      400
    );
  }

    await logAdminAction({
  adminUserId: req.user.id,
  actionType: "NETWORK_REQUEST_REJECTED",
  targetTable: "network_access_requests",
  targetId: id
});

  res.status(200).json({
    success: true,
    message: "Request rejected successfully",
  });


});
exports.getAllDisputes = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = "";
  let params = [];
  let index = 1;

  if (status) {
    whereClause = `WHERE d.status = $${index}`;
    params.push(status);
    index++;
  }

  const disputesQuery = `
    SELECT
      d.id,
      d.po_id,
      d.reason,
      d.status,
      d.admin_resolution,
      d.created_at,
      d.resolved_at,
      po.po_number,
      po.status AS po_status
    FROM po_disputes d
    JOIN purchase_orders po ON d.po_id = po.id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT $${index} OFFSET $${index + 1}
  `;

  params.push(limit, offset);

  const disputes = await pool.query(disputesQuery, params);

  res.status(200).json({
    success: true,
    message: "Disputes fetched successfully",
    data: disputes.rows,
  });
});
exports.resolveDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { action } = req.body;

  if (!["approved", "rejected"].includes(action)) {
    throw new AppError("Invalid action", 400);
  }

  const result = await pool.query(
    `UPDATE po_disputes
     SET status = $1,
         resolved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [action, disputeId]
  );

  if (result.rowCount === 0) {
    throw new AppError("Dispute not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Dispute resolved successfully",
    data: result.rows[0],
  });
});
