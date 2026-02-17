/* =========================================================
   AXO NETWORKS — BUYER CONTROLLER
   Phase 1 (Initial Setup)
========================================================= */

const pool = require("../../config/db");

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
   DASHBOARD STATS (REAL DATA FROM DB)
========================================================= */
exports.getDashboardStats = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return sendResponse(res, 400, false, "Organization not found");
    }

    /* ---------------- RFQ STATS ---------------- */
    const rfqStats = await pool.query(
      `
      SELECT
        COUNT(*) AS total_rfq,
        COUNT(*) FILTER (WHERE status = 'open') AS active_rfq
      FROM rfqs
      WHERE buyer_org_id = $1
      `,
      [organizationId]
    );

    /* ---------------- PO STATS ---------------- */
    const poStats = await pool.query(
      `
      SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (
          WHERE status IN ('issued','accepted','in_progress')
        ) AS pending_orders
      FROM purchase_orders
      WHERE buyer_org_id = $1
      `,
      [organizationId]
    );

    return sendResponse(res, 200, true, "Dashboard stats fetched", {
      total_rfq: Number(rfqStats.rows[0].total_rfq) || 0,
      active_rfq: Number(rfqStats.rows[0].active_rfq) || 0,
      total_orders: Number(poStats.rows[0].total_orders) || 0,
      pending_orders: Number(poStats.rows[0].pending_orders) || 0
    });

  } catch (error) {
    console.error("Buyer Dashboard Error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
};

/* =========================================================
   CREATE RFQ
========================================================= */
exports.createRFQ = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return sendResponse(res, 400, false, "Organization not found");
    }

    const {
      part_name,
      part_description,
      quantity,
      ppap_level,
      design_file_url
    } = req.body;

    if (!part_name || !quantity) {
      return sendResponse(res, 400, false, "Part name and quantity required");
    }

    const result = await pool.query(
      `
      INSERT INTO rfqs
      (buyer_org_id, part_name, part_description, quantity, ppap_level, design_file_url)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        organizationId,
        part_name,
        part_description || null,
        quantity,
        ppap_level || null,
        design_file_url || null
      ]
    );

    return sendResponse(res, 201, true, "RFQ created successfully", result.rows[0]);

  } catch (error) {
    console.error("Create RFQ Error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
};

/* =========================================================
   GET BUYER RFQS (WITH QUOTE COUNT)
========================================================= */
exports.getBuyerRFQs = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return sendResponse(res, 400, false, "Organization not found");
    }

    const result = await pool.query(
      `
      SELECT 
        r.id,
        r.part_name,
        r.part_description,
        r.quantity,
        r.status,
        r.created_at,
        COUNT(q.id)::INT AS quote_count
      FROM rfqs r
      LEFT JOIN quotes q
        ON r.id = q.rfq_id
      WHERE r.buyer_org_id = $1
      GROUP BY r.id
      ORDER BY r.created_at DESC
      `,
      [organizationId]
    );

    return sendResponse(res, 200, true, "RFQs fetched successfully", result.rows);

  } catch (error) {
    console.error("Get Buyer RFQs Error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
};