/* =========================================================
   AXO NETWORKS — BUYER CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const PO_STATUS = require("../../constants/poStatus.constants");
const EVENT_TYPES = require("../../constants/eventTypes.constants");
const { logPoEvent } = require("../../utils/auditLogger");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");

/* =========================================================
   DASHBOARD STATS
========================================================= */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;

  if (!organizationId)
    throw new AppError("Organization not found", 400);

  const [rfqStats, poStats] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::INT AS total_rfq,
              COUNT(*) FILTER (WHERE status = 'open')::INT AS active_rfq
       FROM rfqs
       WHERE buyer_org_id = $1`,
      [organizationId]
    ),
    pool.query(
      `SELECT COUNT(*)::INT AS total_orders,
              COUNT(*) FILTER (
                WHERE status IN ($2,$3,$4)
              )::INT AS pending_orders
       FROM purchase_orders
       WHERE buyer_org_id = $1`,
      [
        organizationId,
        PO_STATUS.ISSUED,
        PO_STATUS.ACCEPTED,
        PO_STATUS.IN_PROGRESS
      ]
    )
  ]);

  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched",
    data: {
      total_rfq: rfqStats.rows[0].total_rfq,
      active_rfq: rfqStats.rows[0].active_rfq,
      total_orders: poStats.rows[0].total_orders,
      pending_orders: poStats.rows[0].pending_orders
    }
  });
});

/* =========================================================
   CREATE RFQ
========================================================= */
exports.createRFQ = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;
  const {
    part_name,
    part_description,
    quantity,
    ppap_level,
    design_file_url
  } = req.body;

  if (!organizationId)
    throw new AppError("Organization not found", 400);

  const result = await pool.query(
    `INSERT INTO rfqs
     (buyer_org_id, part_name, part_description,
      quantity, ppap_level, design_file_url)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      organizationId,
      part_name,
      part_description || null,
      quantity,
      ppap_level || null,
      design_file_url || null
    ]
  );

  res.status(201).json({
    success: true,
    message: "RFQ created successfully",
    data: result.rows[0]
  });
});

/* =========================================================
   ACCEPT QUOTE → CREATE PO
========================================================= */
exports.acceptQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organization_id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const quoteResult = await client.query(
      `SELECT * FROM quotes WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (quoteResult.rowCount === 0)
      throw new AppError("Quote not found", 404);

    const quote = quoteResult.rows[0];

    const rfqResult = await client.query(
      `SELECT * FROM rfqs WHERE id = $1`,
      [quote.rfq_id]
    );

    if (rfqResult.rowCount === 0)
      throw new AppError("RFQ not found", 404);

    const rfq = rfqResult.rows[0];

    if (rfq.buyer_org_id !== organizationId)
      throw new AppError("Unauthorized", 403);

    if (quote.status === "accepted")
      throw new AppError("Quote already accepted", 400);

    await client.query(
      `UPDATE quotes SET status = 'accepted' WHERE id = $1`,
      [id]
    );

    await client.query(
      `UPDATE quotes SET status = 'rejected'
       WHERE rfq_id = $1 AND id != $2`,
      [quote.rfq_id, id]
    );

    const poNumber = `PO-${Date.now()}`;

    const poResult = await client.query(
      `INSERT INTO purchase_orders
       (po_number, rfq_id, quote_id,
        buyer_org_id, supplier_org_id,
        part_name, quantity, value,
        status, accepted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       RETURNING *`,
      [
        poNumber,
        rfq.id,
        quote.id,
        rfq.buyer_org_id,
        quote.supplier_org_id,
        rfq.part_name,
        rfq.quantity,
        quote.price,
        PO_STATUS.ISSUED
      ]
    );

    await logPoEvent(client, {
      poId: poResult.rows[0].id,
      eventType: EVENT_TYPES.PO_CREATED,
      description: "Purchase Order created after quote acceptance",
      actorUserId: req.user.id,
      organizationId,
      actorRole: req.user.role,
      metadata: {
        rfq_id: rfq.id,
        quote_id: quote.id,
        po_number: poNumber,
        po_value: quote.price
      }
    });

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Quote accepted & PO created",
      data: poResult.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
/* =========================================================
   PAY MILESTONE
========================================================= */
exports.payMilestone = asyncHandler(async (req, res) => {
  const { poId, milestoneId } = req.params;
  const { amount } = req.body;

  const organizationId = req.user.organization_id;
  const userId = req.user.id;
  const role = req.user.role;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (poResult.rowCount === 0)
      throw new AppError("PO not found", 404);

    const po = poResult.rows[0];

    if (po.buyer_org_id !== organizationId)
      throw new AppError("Unauthorized", 403);

    if (po.status === PO_STATUS.DISPUTED)
      throw new AppError("Cannot pay disputed PO", 400);

    if (![PO_STATUS.ACCEPTED, PO_STATUS.IN_PROGRESS].includes(po.status))
      throw new AppError("PO not eligible for payment", 400);

    const milestoneResult = await client.query(
      `SELECT * FROM po_milestones
       WHERE id = $1 AND po_id = $2 FOR UPDATE`,
      [milestoneId, poId]
    );

    if (milestoneResult.rowCount === 0)
      throw new AppError("Milestone not found", 404);

    const milestone = milestoneResult.rows[0];

    if (milestone.milestone_name !== "INVOICE_RAISED")
      throw new AppError("Only invoice milestone can be paid", 400);

    if (milestone.status !== "completed")
      throw new AppError("Invoice not completed yet", 400);

    const existingPayment = await client.query(
      `SELECT id FROM payments WHERE milestone_id = $1`,
      [milestoneId]
    );

    if (existingPayment.rowCount > 0)
      throw new AppError("Milestone already paid", 400);

    await client.query(
      `INSERT INTO payments
       (po_id, milestone_id, amount, status,
        paid_at, paid_by_user_id,
        organization_id, created_at)
       VALUES ($1,$2,$3,'paid',NOW(),$4,$5,NOW())`,
      [poId, milestoneId, amount, userId, organizationId]
    );

    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.MILESTONE_PAID,
      description: "Invoice payment completed",
      actorUserId: userId,
      organizationId,
      actorRole: role,
      metadata: { amount }
    });

    await client.query(
      `UPDATE po_milestones
       SET status = 'completed', completed_at = NOW()
       WHERE po_id = $1 AND milestone_name = 'PAID'`,
      [poId]
    );

    await client.query(
      `UPDATE purchase_orders
       SET status = $1
       WHERE id = $2`,
      [PO_STATUS.COMPLETED, poId]
    );

    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.PO_COMPLETED,
      description: "Purchase order marked as completed after final payment",
      actorUserId: userId,
      organizationId,
      actorRole: role
    });

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Milestone payment successful"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
/* =========================================================
   RAISE DISPUTE
========================================================= */
exports.raiseDispute = asyncHandler(async (req, res) => {
  const { poId } = req.params;
  const { reason } = req.body;

  const userId = req.user.id;
  const orgId = req.user.organization_id;
  const role = req.user.role;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (poResult.rowCount === 0)
      throw new AppError("PO not found", 404);

    const po = poResult.rows[0];

    if (po.buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    if ([PO_STATUS.COMPLETED, PO_STATUS.CANCELLED].includes(po.status))
      throw new AppError("Cannot dispute closed PO", 400);

    if (po.status === PO_STATUS.DISPUTED)
      throw new AppError("PO already disputed", 400);

    await client.query(
      `INSERT INTO po_disputes
       (po_id, raised_by_user_id,
        raised_by_role, organization_id,
        reason)
       VALUES ($1,$2,$3,$4,$5)`,
      [poId, userId, role, orgId, reason]
    );

    await client.query(
      `UPDATE purchase_orders
       SET status = $1,
           dispute_flag = true
       WHERE id = $2`,
      [PO_STATUS.DISPUTED, poId]
    );

    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.DISPUTE_RAISED,
      description: reason,
      actorUserId: userId,
      organizationId: orgId,
      actorRole: role
    });

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Dispute raised successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
exports.getBuyerRFQs = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;

  if (!organizationId)
    throw new AppError("Organization not found", 400);

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

  res.status(200).json({
    success: true,
    message: "RFQs fetched successfully",
    data: result.rows
  });
});
exports.getQuotesForRFQ = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;
  const { rfqId } = req.params;

  const rfqCheck = await pool.query(
    `SELECT id FROM rfqs WHERE id = $1 AND buyer_org_id = $2`,
    [rfqId, organizationId]
  );

  if (rfqCheck.rowCount === 0)
    throw new AppError("RFQ not found or unauthorized", 404);

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

  res.status(200).json({
    success: true,
    message: "Quotes fetched successfully",
    data: result.rows
  });
});


exports.rejectQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organization_id;

  const quoteCheck = await pool.query(
    `
    SELECT q.status, r.buyer_org_id
    FROM quotes q
    JOIN rfqs r ON q.rfq_id = r.id
    WHERE q.id = $1
    `,
    [id]
  );

  if (quoteCheck.rowCount === 0)
    throw new AppError("Quote not found", 404);

  if (quoteCheck.rows[0].buyer_org_id !== organizationId)
    throw new AppError("Unauthorized", 403);

  if (quoteCheck.rows[0].status === "accepted")
    throw new AppError("Cannot reject accepted quote", 400);

  await pool.query(
    `UPDATE quotes SET status = 'rejected' WHERE id = $1`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: "Quote rejected successfully"
  });
});
