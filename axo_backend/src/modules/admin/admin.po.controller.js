/* =========================================================
   AXO NETWORKS — ADMIN PO CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");

/* =========================================================
   1️⃣ GET ALL PURCHASE ORDERS
========================================================= */
exports.getAllPurchaseOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const numericPage = Number(page);
  const numericLimit = Number(limit);
  const offset = (numericPage - 1) * numericLimit;

  let whereClause = "";
  let values = [];
  let paramIndex = 1;

  if (status) {
    whereClause = `WHERE po.status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  const countResult = await pool.query(
    `
    SELECT COUNT(*)
    FROM purchase_orders po
    ${whereClause}
    `,
    values
  );

  const totalRecords = Number(countResult.rows[0].count);

  const result = await pool.query(
    `
    SELECT
      po.id,
      po.po_number,
      po.part_name,
      po.quantity,
      po.value,
      po.status,
      po.dispute_flag,
      po.created_at,
      buyer.company_name AS buyer_company,
      supplier.company_name AS supplier_company
    FROM purchase_orders po
    JOIN organizations buyer
      ON po.buyer_org_id = buyer.id
    JOIN organizations supplier
      ON po.supplier_org_id = supplier.id
    ${whereClause}
    ORDER BY po.created_at DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
    `,
    [...values, numericLimit, offset]
  );

  res.status(200).json({
    success: true,
    message: "Purchase orders fetched successfully",
    data: {
      total_records: totalRecords,
      current_page: numericPage,
      total_pages: Math.ceil(totalRecords / numericLimit),
      purchase_orders: result.rows,
    },
  });
});

/* =========================================================
   2️⃣ GET SINGLE PO FULL DETAILS
========================================================= */
exports.getPurchaseOrderDetails = asyncHandler(async (req, res) => {
  const { poId } = req.params;

  const poResult = await pool.query(
    `SELECT * FROM purchase_orders WHERE id = $1`,
    [poId]
  );

  if (poResult.rowCount === 0) {
    throw new AppError("Purchase order not found", 404, {
      errorCode: "PO_NOT_FOUND",
    });
  }

  const [milestones, payments, disputes] = await Promise.all([
    pool.query(
      `SELECT * FROM po_milestones 
       WHERE po_id = $1 
       ORDER BY sequence_order ASC`,
      [poId]
    ),
    pool.query(`SELECT * FROM payments WHERE po_id = $1`, [poId]),
    pool.query(`SELECT * FROM po_disputes WHERE po_id = $1`, [poId]),
  ]);

  res.status(200).json({
    success: true,
    message: "Purchase order details fetched",
    data: {
      purchase_order: poResult.rows[0],
      milestones: milestones.rows,
      payments: payments.rows,
      disputes: disputes.rows,
    },
  });
});

/* =========================================================
   3️⃣ ADMIN FORCE CANCEL PURCHASE ORDER
========================================================= */
exports.forceCancelPurchaseOrder = asyncHandler(async (req, res) => {
  const { poId } = req.params;
  const { reason } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (poResult.rowCount === 0) {
      throw new AppError("Purchase order not found", 404);
    }

    const po = poResult.rows[0];

    if (["completed", "cancelled"].includes(po.status)) {
      throw new AppError("PO already closed", 400);
    }

    await client.query(
      `UPDATE purchase_orders
       SET status = 'cancelled'
       WHERE id = $1`,
      [poId]
    );

    await client.query(
      `INSERT INTO po_events
       (po_id, event_type, description,
        actor_user_id, organization_id, actor_role, metadata)
       VALUES ($1,'PO_FORCE_CANCELLED',$2,$3,$4,$5,$6)`,
      [
        poId,
        reason || "Admin force cancelled the purchase order",
        req.user.id,
        req.user.organization_id,
        req.user.role,
        JSON.stringify({ admin_override: true }),
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Purchase order force cancelled successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

/* =========================================================
   4️⃣ ADMIN FORCE CLOSE PURCHASE ORDER
========================================================= */
exports.forceClosePurchaseOrder = asyncHandler(async (req, res) => {
  const { poId } = req.params;
  const { note } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (poResult.rowCount === 0) {
      throw new AppError("Purchase order not found", 404);
    }

    await client.query(
      `UPDATE purchase_orders
       SET status = 'completed'
       WHERE id = $1`,
      [poId]
    );

    await client.query(
      `INSERT INTO po_events
       (po_id, event_type, description,
        actor_user_id, organization_id, actor_role, metadata)
       VALUES ($1,'PO_FORCE_CLOSED',$2,$3,$4,$5,$6)`,
      [
        poId,
        note || "Admin force closed the purchase order",
        req.user.id,
        req.user.organization_id,
        req.user.role,
        JSON.stringify({ admin_override: true }),
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Purchase order force closed successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
