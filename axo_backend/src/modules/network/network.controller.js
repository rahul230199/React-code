/* =========================================================
   AXO NETWORKS — NETWORK CONTROLLER (ENTERPRISE READY)
   - Clean structure
   - Scalable query (NO N+1)
   - Server-side pagination
   - Sorting + filtering
   - Production safe
========================================================= */

const pool = require("../../config/db");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");
const { getReliabilityTier } = require("../../utils/reliability.service");

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
     NORMALIZE role_in_ev
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
     DUPLICATE CHECK
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
     INSERT
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


/* =========================================================
   GET NETWORK SUPPLIERS (SCALABLE VERSION)
   - Single aggregated query
   - No N+1 queries
   - Pagination + sorting + filtering
========================================================= */
exports.getNetworkSuppliers = asyncHandler(async (req, res) => {
if (req.user.role !== "buyer") {
  throw new AppError("Access denied.", 403);
}
  const {
    page = 1,
    limit = 12,
    sort = "reliability_desc",
    gold_only,
    min_available_capacity,
    search
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  /* =====================================================
     SORT LOGIC
  ===================================================== */
  let orderClause = "reliability_score DESC NULLS LAST";

  if (sort === "capacity_desc")
    orderClause = "monthly_capacity DESC NULLS LAST";

  if (sort === "reliability_asc")
    orderClause = "reliability_score ASC NULLS LAST";

  /* =====================================================
     SEARCH CONDITION
  ===================================================== */
  let searchClause = "";
  let params = [limitNum, offset];
  let paramIndex = 3;

  if (search) {
    searchClause = `
      AND (
        o.company_name ILIKE $${paramIndex}
        OR o.certifications ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  /* =====================================================
     BASE AGGREGATED QUERY
     - Includes workload aggregation
     - NO N+1
  ===================================================== */
  const baseQuery = `
    FROM organizations o
    LEFT JOIN reliability_scores rs
      ON rs.organization_id = o.id
    LEFT JOIN purchase_orders po
      ON po.supplier_org_id = o.id
      AND po.status IN ('ISSUED','ACCEPTED','IN_PROGRESS')
    WHERE o.role_type = 'supplier'
    ${searchClause}
    GROUP BY o.id, rs.score
  `;

  const totalResult = await pool.query(
    `SELECT COUNT(*) FROM organizations o
     WHERE o.role_type = 'supplier'`
  );

  const suppliers = await pool.query(
    `
    SELECT
      o.id,
      o.company_name,
      o.monthly_capacity,
      COALESCE(rs.score,0) AS reliability_score,
      COALESCE(SUM(po.quantity),0)::NUMERIC AS active_quantity
    ${baseQuery}
    ORDER BY ${orderClause}
    LIMIT $1 OFFSET $2
    `,
    params
  );

  const enriched = suppliers.rows.map(supplier => {

    const capacity = Number(supplier.monthly_capacity || 0);
    const active = Number(supplier.active_quantity || 0);

    const utilizationPercent =
      capacity > 0
        ? Math.round((active / capacity) * 100)
        : 0;

    const availableCapacity = 100 - utilizationPercent;

    if (gold_only === "true" &&
        supplier.reliability_score < 85)
      return null;

    if (min_available_capacity &&
        availableCapacity < Number(min_available_capacity))
      return null;

    const tierInfo =
      getReliabilityTier(supplier.reliability_score);

    return {
      id: supplier.id,
      company_name: supplier.company_name,
      monthly_capacity: capacity,
      reliability_score: supplier.reliability_score,
      reliability_tier: tierInfo.tier,
      utilization_percent: utilizationPercent,
      available_capacity_percent: availableCapacity,
      overload: utilizationPercent > 100,
      capacity_risk: utilizationPercent >= 85
    };
  }).filter(Boolean);

  res.status(200).json({
    success: true,
    data: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: Number(totalResult.rows[0].count)
    }
  });

});


/* =========================================================
   GET SINGLE SUPPLIER DETAIL
========================================================= */
exports.getSupplierById = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const supplier = await pool.query(
    `
    SELECT
      o.id,
      o.company_name,
      o.monthly_capacity,
      o.certifications,
      COALESCE(rs.score,0) AS reliability_score,
      COALESCE(SUM(po.quantity),0)::NUMERIC AS active_quantity
    FROM organizations o
    LEFT JOIN reliability_scores rs
      ON rs.organization_id = o.id
    LEFT JOIN purchase_orders po
      ON po.supplier_org_id = o.id
      AND po.status IN ('ISSUED','ACCEPTED','IN_PROGRESS')
    WHERE o.id = $1
      AND o.role_type = 'supplier'
    GROUP BY o.id, rs.score
    `,
    [id]
  );

  if (!supplier.rowCount)
    throw new AppError("Supplier not found", 404);

  const s = supplier.rows[0];

  const capacity = Number(s.monthly_capacity || 0);
  const active = Number(s.active_quantity || 0);

  const utilizationPercent =
    capacity > 0
      ? Math.round((active / capacity) * 100)
      : 0;

  res.status(200).json({
    success: true,
    data: {
      id: s.id,
      company_name: s.company_name,
      monthly_capacity: capacity,
      certifications: s.certifications,
      reliability_score: s.reliability_score,
      reliability_tier:
        getReliabilityTier(s.reliability_score).tier,
      utilization_percent: utilizationPercent,
      overload: utilizationPercent > 100,
      capacity_risk: utilizationPercent >= 85
    }
  });

});