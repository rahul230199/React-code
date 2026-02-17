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

/* =========================================================
   ACCEPT QUOTE → CREATE PURCHASE ORDER
   Phase 2
========================================================= */
exports.acceptQuote = async (req, res) => {
  const { id } = req.params; // quote id
  const organizationId = req.user.organization_id;

  if (!organizationId) {
    return sendResponse(res, 400, false, "Organization not found");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -----------------------------------------------------
       1️⃣ Get Quote (LOCK ROW)
    ----------------------------------------------------- */
    const quoteResult = await client.query(
      `SELECT * FROM quotes WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (quoteResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "Quote not found");
    }

    const quote = quoteResult.rows[0];

    /* -----------------------------------------------------
       2️⃣ Get RFQ (Verify Ownership)
    ----------------------------------------------------- */
    const rfqResult = await client.query(
      `SELECT * FROM rfqs WHERE id = $1`,
      [quote.rfq_id]
    );

    if (rfqResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return sendResponse(res, 404, false, "RFQ not found");
    }

    const rfq = rfqResult.rows[0];

    if (rfq.buyer_org_id !== organizationId) {
      await client.query("ROLLBACK");
      return sendResponse(res, 403, false, "Unauthorized");
    }

    if (quote.status === "accepted") {
      await client.query("ROLLBACK");
      return sendResponse(res, 400, false, "Quote already accepted");
    }

    /* -----------------------------------------------------
       3️⃣ Accept Selected Quote
    ----------------------------------------------------- */
    await client.query(
      `UPDATE quotes SET status = 'accepted' WHERE id = $1`,
      [id]
    );

    /* -----------------------------------------------------
       4️⃣ Reject Other Quotes
    ----------------------------------------------------- */
    await client.query(
      `UPDATE quotes
       SET status = 'rejected'
       WHERE rfq_id = $1 AND id != $2`,
      [quote.rfq_id, id]
    );

    /* -----------------------------------------------------
       5️⃣ Generate PO Number
    ----------------------------------------------------- */
    const poNumber = `PO-${Date.now()}`;

    /* -----------------------------------------------------
       6️⃣ Create Purchase Order
    ----------------------------------------------------- */
    const poResult = await client.query(
      `
      INSERT INTO purchase_orders
      (
        po_number,
        rfq_id,
        quote_id,
        buyer_org_id,
        supplier_org_id,
        part_name,
        quantity,
        value,
        status,
        accepted_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'issued',NOW())
      RETURNING *
      `,
      [
        poNumber,
        rfq.id,
        quote.id,
        rfq.buyer_org_id,
        quote.supplier_org_id,
        rfq.part_name,
        rfq.quantity,
        quote.price
      ]
    );

    /* -----------------------------------------------------
       7️⃣ Insert PO Event (Audit)
    ----------------------------------------------------- */
    await client.query(
      `
      INSERT INTO po_events (po_id, event_type, description)
      VALUES ($1, 'PO_CREATED', 'Purchase Order created after quote acceptance')
      `,
      [poResult.rows[0].id]
    );

    await client.query("COMMIT");

    return sendResponse(res, 200, true, "Quote accepted & PO created", poResult.rows[0]);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Accept Quote Error:", error);
    return sendResponse(res, 500, false, "Server error");
  } finally {
    client.release();
  }
};

/* =========================================================
   GET ALL QUOTES FOR SPECIFIC RFQ
========================================================= */
exports.getQuotesForRFQ = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { rfqId } = req.params;

    const rfqCheck = await pool.query(
      `SELECT * FROM rfqs WHERE id = $1 AND buyer_org_id = $2`,
      [rfqId, organizationId]
    );

    if (rfqCheck.rows.length === 0) {
      return sendResponse(res, 404, false, "RFQ not found or unauthorized");
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        supplier_org_id,
        price,
        timeline_days,
        certifications,
        reliability_snapshot,
        status,
        created_at
      FROM quotes
      WHERE rfq_id = $1
      ORDER BY created_at ASC
      `,
      [rfqId]
    );

    return sendResponse(res, 200, true, "Quotes fetched successfully", result.rows);

  } catch (error) {
    console.error("Get Quotes Error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
};

/* =========================================================
   REJECT QUOTE
========================================================= */
exports.rejectQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const quoteCheck = await pool.query(
      `
      SELECT q.*, r.buyer_org_id
      FROM quotes q
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE q.id = $1
      `,
      [id]
    );

    if (quoteCheck.rows.length === 0) {
      return sendResponse(res, 404, false, "Quote not found");
    }

    if (quoteCheck.rows[0].buyer_org_id !== organizationId) {
      return sendResponse(res, 403, false, "Unauthorized");
    }

    if (quoteCheck.rows[0].status === "accepted") {
      return sendResponse(res, 400, false, "Cannot reject accepted quote");
    }

    await pool.query(
      `UPDATE quotes SET status = 'rejected' WHERE id = $1`,
      [id]
    );

    return sendResponse(res, 200, true, "Quote rejected successfully");

  } catch (error) {
    console.error("Reject Quote Error:", error);
    return sendResponse(res, 500, false, "Server error");
  }
};