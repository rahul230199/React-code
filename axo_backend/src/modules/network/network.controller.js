/* =========================================================
   AXO NETWORKS — NETWORK CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");

/* =========================================================
   SUBMIT NETWORK ACCESS REQUEST
========================================================= */
exports.submitRequest = asyncHandler(async (req, res) => {
  let {
    company_name,
    website,
    registered_address,
    city_state,
    contact_name,
    role_requested,
    email,
    phone,
    what_you_do,
    primary_product,
    key_components,
    manufacturing_locations,
    monthly_capacity,
    certifications,
    role_in_ev,
    why_join_axo,
  } = req.body;

  /* =====================================================
     NORMALIZE role_in_ev (DB CHECK SAFE)
  ===================================================== */
  const roleInEvMap = {
    oem: "OEMs",
    oems: "OEMs",
    supplier: "Supplier",
    both: "Both",
  };

  role_in_ev =
    roleInEvMap[String(role_in_ev).toLowerCase()] || role_in_ev;

  const allowedRoleInEv = ["OEMs", "Supplier", "Both"];

  if (!allowedRoleInEv.includes(role_in_ev)) {
    throw new AppError(
      "Invalid role_in_ev. Allowed: OEMs, Supplier, Both",
      400
    );
  }

  /* =====================================================
     DUPLICATE EMAIL CHECK (ANTI-SPAM PROTECTION)
  ===================================================== */
  const existing = await pool.query(
    `SELECT id FROM public.network_access_requests
     WHERE email = $1 AND status = 'pending'`,
    [email.toLowerCase().trim()]
  );

  if (existing.rowCount > 0) {
    throw new AppError(
      "A pending request already exists for this email",
      400
    );
  }

  /* =====================================================
     META DATA
  ===================================================== */
  const ip_address =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const user_agent = req.headers["user-agent"];

  /* =====================================================
     INSERT INTO DATABASE
  ===================================================== */
  const result = await pool.query(
    `
    INSERT INTO public.network_access_requests (
      company_name,
      website,
      registered_address,
      city_state,
      contact_name,
      role_requested,
      email,
      phone,
      what_you_do,
      primary_product,
      key_components,
      manufacturing_locations,
      monthly_capacity,
      certifications,
      role_in_ev,
      why_join_axo,
      ip_address,
      user_agent,
      status,
      created_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,
      'pending',
      NOW()
    )
    RETURNING id
    `,
    [
      company_name.trim(),
      website || null,
      registered_address || null,
      city_state.trim(),
      contact_name.trim(),
      role_requested || null,
      email.toLowerCase().trim(),
      phone.trim(),
      JSON.stringify(what_you_do || []),
      primary_product.trim(),
      key_components.trim(),
      manufacturing_locations.trim(),
      monthly_capacity.trim(),
      certifications || null,
      role_in_ev,
      why_join_axo.trim(),
      ip_address,
      user_agent,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Request submitted successfully",
    data: {
      requestId: result.rows[0].id,
    },
  });
});
