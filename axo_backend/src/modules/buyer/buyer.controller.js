/* =========================================================
   AXO NETWORKS — BUYER CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const PO_STATUS = require("../../constants/poStatus.constants");
const EVENT_TYPES = require("../../constants/eventTypes.constants");
const { logPoEvent } = require("../../utils/auditLogger");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");
const PDFDocument = require("pdfkit");
const { createNotification } = require("../../utils/notificationService"); // adjust path if needed

/* =========================================================
   DASHBOARD STATS
   - Aggregated metrics
   - Parallel execution
   - Organization scoped
========================================================= */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  if (!orgId) throw new AppError("Organization not found", 400);

  const [rfqStats, poStats] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::INT AS total_rfq,
              COUNT(*) FILTER (WHERE status = 'open')::INT AS active_rfq
       FROM rfqs
       WHERE buyer_org_id = $1`,
      [orgId]
    ),
    pool.query(
      `SELECT COUNT(*)::INT AS total_orders,
              COUNT(*) FILTER (
                WHERE status IN ($2,$3,$4)
              )::INT AS pending_orders
       FROM purchase_orders
       WHERE buyer_org_id = $1`,
      [orgId, PO_STATUS.ISSUED, PO_STATUS.ACCEPTED, PO_STATUS.IN_PROGRESS]
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
   Purpose:
   - Allows buyer to create a new RFQ
   - Validates business rules
   - Ensures organization ownership
   - Logs audit event (future traceability)
   - Production-safe structured implementation
========================================================= */
exports.createRFQ = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;
  const userId = req.user.id;
  const role = req.user.role;

  if (!organizationId) {
    throw new AppError("Organization not found", 400);
  }

  let {
    part_name,
    part_description,
    quantity,
    ppap_level,
    design_file_url
  } = req.body;

  /* -------------------------
     Basic Input Validation
  --------------------------*/
  if (!part_name || typeof part_name !== "string") {
    throw new AppError("Part name is required", 400);
  }

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    throw new AppError("Quantity must be a positive number", 400);
  }

  // Trim & sanitize
  part_name = part_name.trim();
  part_description = part_description?.trim() || null;
  design_file_url = design_file_url?.trim() || null;
  quantity = Number(quantity);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO rfqs
       (buyer_org_id, part_name, part_description,
        quantity, ppap_level, design_file_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        organizationId,
        part_name,
        part_description,
        quantity,
        ppap_level || null,
        design_file_url
      ]
    );

    /* -------------------------
       Optional: Future Audit Log
       (You can later move this to centralized audit service)
    --------------------------*/
    await client.query(
  `INSERT INTO admin_audit_logs
   (admin_user_id, action_type, target_table, target_id, metadata)
   VALUES ($1,$2,$3,$4,$5)`,
  [
    userId,
    "RFQ_CREATED",
    "rfqs",
    result.rows[0].id,
    JSON.stringify({
      part_name,
      quantity,
      organization_id: organizationId
    })
  ]
);

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      data: result.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

/* =========================================================
   ACCEPT QUOTE → CREATE PO
   - Row locking
   - Atomic updates
   - Audit event
   - Double acceptance prevention
========================================================= */
exports.acceptQuote = asyncHandler(async (req, res) => {
  const quoteId = Number(req.params.id);
  const orgId = req.user.organization_id;

  if (!quoteId || isNaN(quoteId))
    throw new AppError("Invalid quote id", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const quoteRes = await client.query(
      `SELECT * FROM quotes WHERE id = $1 FOR UPDATE`,
      [quoteId]
    );
    if (!quoteRes.rowCount) throw new AppError("Quote not found", 404);

    const quote = quoteRes.rows[0];

    const rfqRes = await client.query(
      `SELECT * FROM rfqs WHERE id = $1`,
      [quote.rfq_id]
    );
    if (!rfqRes.rowCount) throw new AppError("RFQ not found", 404);

    const rfq = rfqRes.rows[0];

    if (rfq.buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    if (quote.status === "accepted")
      throw new AppError("Quote already accepted", 400);

    await client.query(
      `UPDATE quotes SET status = 'accepted' WHERE id = $1`,
      [quoteId]
    );

    await client.query(
      `UPDATE quotes SET status = 'rejected'
       WHERE rfq_id = $1 AND id != $2`,
      [quote.rfq_id, quoteId]
    );

    const poNumber = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const poRes = await client.query(
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
    await createNotification(client, {
  organizationId: orgId,
  role: "buyer",
  title: "PO Created",
  message: `PO ${poRes.rows[0].po_number} created successfully`,
  type: "PO_CREATED",
  referenceType: "purchase_orders",
  referenceId: poRes.rows[0].id
});

    await logPoEvent(client, {
      poId: poRes.rows[0].id,
      eventType: EVENT_TYPES.PO_CREATED,
      description: "PO created from accepted quote",
      actorUserId: req.user.id,
      organizationId: orgId,
      actorRole: req.user.role,
      metadata: { rfq_id: rfq.id, quote_id: quote.id }
    });

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Quote accepted & PO created",
      data: poRes.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
/* =========================================================
   PAY MILESTONE (FINANCIAL CRITICAL FLOW)
   Purpose:
   - Allows buyer to pay invoice milestone
   - Fully transaction protected
   - Prevents double payment
   - Prevents under/over payment
   - Ensures correct PO state transition
   - Audit logged
   - Enterprise-grade financial validation
========================================================= */
exports.payMilestone = asyncHandler(async (req, res) => {
  const poId = Number(req.params.poId);
  const milestoneId = Number(req.params.milestoneId);
  const amount = Number(req.body.amount);

  const orgId = req.user.organization_id;
  const userId = req.user.id;
  const role = req.user.role;

  if (!poId || isNaN(poId)) throw new AppError("Invalid PO id", 400);
  if (!milestoneId || isNaN(milestoneId)) throw new AppError("Invalid milestone id", 400);
  if (!amount || isNaN(amount) || amount <= 0)
    throw new AppError("Invalid payment amount", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -------------------------
       Lock PO row (Concurrency Safety)
    --------------------------*/
    const poRes = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (!poRes.rowCount) throw new AppError("PO not found", 404);

    const po = poRes.rows[0];

    if (po.buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    if (po.status === PO_STATUS.DISPUTED)
      throw new AppError("Cannot pay disputed PO", 400);

    if (![PO_STATUS.ACCEPTED, PO_STATUS.IN_PROGRESS].includes(po.status))
      throw new AppError("PO not eligible for payment", 400);

    /* -------------------------
       Lock Milestone
    --------------------------*/
    const milestoneRes = await client.query(
      `SELECT * FROM po_milestones
       WHERE id = $1 AND po_id = $2
       FOR UPDATE`,
      [milestoneId, poId]
    );

    if (!milestoneRes.rowCount)
      throw new AppError("Milestone not found", 404);

    const milestone = milestoneRes.rows[0];

    if (milestone.milestone_name !== "INVOICE_RAISED")
      throw new AppError("Only invoice milestone can be paid", 400);

    if (milestone.status !== "completed")
      throw new AppError("Invoice milestone not completed", 400);

    /* -------------------------
       Prevent Double Payment
    --------------------------*/
    const paymentCheck = await client.query(
      `SELECT id FROM payments WHERE milestone_id = $1 FOR UPDATE`,
      [milestoneId]
    );

    if (paymentCheck.rowCount > 0)
      throw new AppError("Milestone already paid", 400);

    /* -------------------------
       Strict Financial Validation
    --------------------------*/
    const expectedAmount = Number(po.value);

// Allow minor floating precision difference (financial safe comparison)
if (Math.abs(amount - expectedAmount) > 0.01)
  throw new AppError("Payment amount mismatch", 400);

    /* -------------------------
       Insert Payment
    --------------------------*/
    await client.query(
      `INSERT INTO payments
       (po_id, milestone_id, amount, status,
        paid_at, paid_by_user_id,
        organization_id, created_at)
       VALUES ($1,$2,$3,'paid',NOW(),$4,$5,NOW())`,
      [poId, milestoneId, amount, userId, orgId]
    );

    /* -------------------------
       Mark PAID milestone complete
    --------------------------*/
    await client.query(
      `UPDATE po_milestones
       SET status = 'completed',
           completed_at = NOW()
       WHERE po_id = $1
         AND milestone_name = 'PAID'`,
      [poId]
    );

    /* -------------------------
       Final PO Status Transition
    --------------------------*/
    await client.query(
      `UPDATE purchase_orders
       SET status = $1
       WHERE id = $2`,
      [PO_STATUS.COMPLETED, poId]
    );

    /* -------------------------
       Audit Events
    --------------------------*/
    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.MILESTONE_PAID,
      description: "Invoice payment completed",
      actorUserId: userId,
      organizationId: orgId,
      actorRole: role,
      metadata: { amount }
    });

    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.PO_COMPLETED,
      description: "Purchase order marked as completed",
      actorUserId: userId,
      organizationId: orgId,
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
   RAISE DISPUTE (STATE CRITICAL FLOW)
   Purpose:
   - Allows buyer to raise dispute on active PO
   - Prevents duplicate disputes
   - Prevents dispute on closed POs
   - Fully transaction protected
   - Status transition safe
   - Audit logged
========================================================= */
exports.raiseDispute = asyncHandler(async (req, res) => {
  const poId = Number(req.params.poId);
  const reason = req.body.reason?.trim();

  const userId = req.user.id;
  const orgId = req.user.organization_id;
  const role = req.user.role;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  if (!reason || reason.length < 5)
    throw new AppError("Dispute reason must be provided", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -------------------------
       Lock PO Row
    --------------------------*/
    const poRes = await client.query(
      `SELECT * FROM purchase_orders
       WHERE id = $1
       FOR UPDATE`,
      [poId]
    );

    if (!poRes.rowCount)
      throw new AppError("PO not found", 404);

    const po = poRes.rows[0];

    if (po.buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    /* -------------------------
       Prevent Dispute on Closed States
    --------------------------*/
    if ([PO_STATUS.COMPLETED, PO_STATUS.CANCELLED].includes(po.status))
      throw new AppError("Cannot dispute closed PO", 400);

    if (po.status === PO_STATUS.DISPUTED)
      throw new AppError("PO already disputed", 400);

    /* -------------------------
       Prevent Duplicate Active Dispute
    --------------------------*/
    const existingDispute = await client.query(
      `SELECT id
       FROM po_disputes
       WHERE po_id = $1
         AND resolved_at IS NULL
       FOR UPDATE`,
      [poId]
    );

    if (existingDispute.rowCount > 0)
      throw new AppError("Active dispute already exists", 400);

    /* -------------------------
       Insert Dispute Record
    --------------------------*/
    await client.query(
      `INSERT INTO po_disputes
       (po_id, raised_by_user_id,
        raised_by_role, organization_id,
        reason, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [poId, userId, role, orgId, reason]
    );

    /* -------------------------
       Update PO Status
    --------------------------*/
    await client.query(
      `UPDATE purchase_orders
       SET status = $1,
           dispute_flag = true,
           updated_at = NOW()
       WHERE id = $2`,
      [PO_STATUS.DISPUTED, poId]
    );

    /* -------------------------
       Audit Event
    --------------------------*/
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
/* =========================================================
   RFQ LISTING (PAGINATED + FILTERED)
   - Safe pagination
   - Limit capped
   - Status filter optional
========================================================= */
exports.getBuyerRFQs = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  if (!orgId) throw new AppError("Organization not found", 400);

  let { page = 1, limit = 10, status } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

  const offset = (page - 1) * limit;

  let statusFilter = "";
  const params = [orgId];

  if (status) {
    params.push(status);
    statusFilter = `AND r.status = $${params.length}`;
  }
params.push(limit);
params.push(offset);

const result = await pool.query(
  `
  SELECT r.id, r.part_name, r.quantity, r.status, r.created_at,
         COUNT(q.id)::INT AS quote_count
  FROM rfqs r
  LEFT JOIN quotes q ON r.id = q.rfq_id
  WHERE r.buyer_org_id = $1
  ${statusFilter}
  GROUP BY r.id
  ORDER BY r.created_at DESC
  LIMIT $${params.length - 1}
  OFFSET $${params.length}
  `,
  params
);

  res.status(200).json({
    success: true,
    message: "RFQs fetched successfully",
    data: result.rows
  });
});

/* =========================================================
   GET QUOTES FOR RFQ (PAGINATED + SAFE)
   Purpose:
   - Fetch quotes for buyer-owned RFQ
   - Enforces organization ownership
   - Pagination protected
   - Optional status filter
   - Enterprise-grade query handling
========================================================= */
exports.getQuotesForRFQ = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const rfqId = Number(req.params.rfqId);

  if (!rfqId || isNaN(rfqId))
    throw new AppError("Invalid RFQ id", 400);

  if (!orgId)
    throw new AppError("Organization not found", 400);

  /* -------------------------
     Validate RFQ Ownership
  --------------------------*/
  const rfqCheck = await pool.query(
    `SELECT id FROM rfqs
     WHERE id = $1 AND buyer_org_id = $2`,
    [rfqId, orgId]
  );

  if (!rfqCheck.rowCount)
    throw new AppError("RFQ not found or unauthorized", 404);

  /* -------------------------
     Pagination
  --------------------------*/
  let { page = 1, limit = 10, status } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

  const offset = (page - 1) * limit;

  /* -------------------------
     Optional Status Filter
  --------------------------*/
  let statusFilter = "";
  const params = [rfqId];

  if (status) {
    params.push(status);
    statusFilter = `AND status = $${params.length}`;
  }

 params.push(limit);
params.push(offset);

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
  ${statusFilter}
  ORDER BY created_at ASC
  LIMIT $${params.length - 1}
  OFFSET $${params.length}
  `,
  params
);

  res.status(200).json({
    success: true,
    message: "Quotes fetched successfully",
    data: result.rows
  });
});

/* =========================================================
   REJECT QUOTE (STATE CONTROLLED FLOW)
   Purpose:
   - Allows buyer to reject a quote
   - Prevents rejecting accepted quotes
   - Prevents double rejection
   - Row-level locking
   - Fully transactional
   - Audit logged
========================================================= */
exports.rejectQuote = asyncHandler(async (req, res) => {
  const quoteId = Number(req.params.id);
  const orgId = req.user.organization_id;
  const userId = req.user.id;
  const role = req.user.role;

  if (!quoteId || isNaN(quoteId))
    throw new AppError("Invalid quote id", 400);

  if (!orgId)
    throw new AppError("Organization not found", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -------------------------
       Lock Quote Row
    --------------------------*/
    const quoteRes = await client.query(
      `SELECT q.*, r.buyer_org_id
       FROM quotes q
       JOIN rfqs r ON q.rfq_id = r.id
       WHERE q.id = $1
       FOR UPDATE`,
      [quoteId]
    );

    if (!quoteRes.rowCount)
      throw new AppError("Quote not found", 404);

    const quote = quoteRes.rows[0];

    if (quote.buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    /* -------------------------
       Prevent Rejecting Accepted Quote
    --------------------------*/
    if (quote.status === "accepted")
      throw new AppError("Cannot reject accepted quote", 400);

    if (quote.status === "rejected")
      throw new AppError("Quote already rejected", 400);

    /* -------------------------
       Update Status
    --------------------------*/
    await client.query(
      `UPDATE quotes
       SET status = 'rejected',
           updated_at = NOW()
       WHERE id = $1`,
      [quoteId]
    );

    /* -------------------------
       Audit Event
    --------------------------*/
  await client.query(
  `INSERT INTO admin_audit_logs
   (admin_user_id, action_type, target_table, target_id, metadata)
   VALUES ($1,$2,$3,$4,$5)`,
  [
    userId,
    "QUOTE_REJECTED",
    "quotes",
    quoteId,
    JSON.stringify({ rfq_id: quote.rfq_id, organization_id: orgId })
  ]
);

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Quote rejected successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

/* =========================================================
   GET BUYER PURCHASE ORDERS (PAGINATED)
   - Org scoped
   - Status filter
   - Pagination safe
========================================================= */
exports.getBuyerOrders = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  if (!orgId) throw new AppError("Organization not found", 400);

  let { page = 1, limit = 10, status } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

  const offset = (page - 1) * limit;

  let statusFilter = "";
  const params = [orgId];

  if (status) {
    params.push(status);
    statusFilter = `AND status = $${params.length}`;
  }

  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `
    SELECT 
      id,
      po_number,
      part_name,
      quantity,
      value,
      status,
      accepted_at,
      created_at
    FROM purchase_orders
    WHERE buyer_org_id = $1
    ${statusFilter}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
    `,
    params
  );

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: result.rows
  });
});

/* =========================================================
   GET PO MILESTONES
   - Org scoped
========================================================= */
exports.getPOMilestones = asyncHandler(async (req, res) => {
  const poId = Number(req.params.poId);
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  const poCheck = await pool.query(
    `SELECT id FROM purchase_orders
     WHERE id = $1 AND buyer_org_id = $2`,
    [poId, orgId]
  );

  if (!poCheck.rowCount)
    throw new AppError("PO not found or unauthorized", 404);

  const result = await pool.query(
    `SELECT id, milestone_name, status
     FROM po_milestones
     WHERE po_id = $1
     ORDER BY id ASC`,
    [poId]
  );

  res.status(200).json({
    success: true,
    message: "Milestones fetched",
    data: result.rows
  });
});

/* =========================================================
   GET SINGLE PURCHASE ORDER DETAIL
   - Org scoped
   - Used for PO detail page
========================================================= */
exports.getBuyerOrderById = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  const result = await pool.query(
    `
    SELECT 
      id,
      po_number,
      part_name,
      quantity,
      value,
      status,
      buyer_org_id,
      supplier_org_id,
      created_at,
      accepted_at
    FROM purchase_orders
    WHERE id = $1 AND buyer_org_id = $2
    `,
    [poId, orgId]
  );

  if (!result.rowCount)
    throw new AppError("PO not found or unauthorized", 404);

  res.status(200).json({
    success: true,
    message: "PO fetched successfully",
    data: result.rows[0]
  });

});

/* =========================================================
   GET PO PAYMENTS
   - Org scoped
   - Returns payment history + financial summary
========================================================= */
exports.getPOPayments = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  /* Validate PO ownership */
  const poCheck = await pool.query(
    `SELECT value FROM purchase_orders
     WHERE id = $1 AND buyer_org_id = $2`,
    [poId, orgId]
  );

  if (!poCheck.rowCount)
    throw new AppError("PO not found or unauthorized", 404);

  const totalValue = Number(poCheck.rows[0].value);

  const payments = await pool.query(
    `
    SELECT 
      id,
      amount,
      status,
      paid_at,
      created_at
    FROM payments
    WHERE po_id = $1
    ORDER BY created_at ASC
    `,
    [poId]
  );

  const totalPaid = payments.rows.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const balance = totalValue - totalPaid;

  res.status(200).json({
    success: true,
    message: "Payment history fetched",
    data: {
      total_value: totalValue,
      total_paid: totalPaid,
      balance,
      payments: payments.rows
    }
  });

});

/* =========================================================
   GET PO AUDIT TRAIL
========================================================= */
exports.getPOEvents = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  /* Validate ownership */
  const poCheck = await pool.query(
    `SELECT id FROM purchase_orders
     WHERE id = $1 AND buyer_org_id = $2`,
    [poId, orgId]
  );

  if (!poCheck.rowCount)
    throw new AppError("PO not found or unauthorized", 404);

  const events = await pool.query(
    `
    SELECT 
      event_type,
      actor_role,
      description,
      created_at
    FROM po_events
    WHERE po_id = $1
    ORDER BY created_at ASC
    `,
    [poId]
  );

  res.status(200).json({
    success: true,
    message: "Audit trail fetched",
    data: events.rows
  });

});

/* =========================================================
   GENERATE PROFESSIONAL PO PDF
   - Org scoped
   - Production ready
========================================================= */

exports.generatePOPdf = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId)) {
    throw new AppError("Invalid purchase order.", 400);
  }

  const result = await pool.query(
    `SELECT * FROM purchase_orders
     WHERE id = $1 AND buyer_org_id = $2`,
    [poId, orgId]
  );

  if (!result.rowCount) {
    throw new AppError("Purchase order not found.", 404);
  }

  const po = result.rows[0];

  // 🚀 Disable caching completely
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="PO-${po.po_number}.pdf"`,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store"
  });

  const doc = new PDFDocument({
    margin: 50,
    size: "A4"
  });

  doc.on("error", (err) => {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });

  doc.pipe(res);

  // Content
  doc.fontSize(20).text("AXO NETWORKS", { align: "center" });
  doc.moveDown();
  doc.fontSize(16).text("PURCHASE ORDER", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(12);
  doc.text(`PO Number: ${po.po_number}`);
  doc.text(`Status: ${po.status}`);
  doc.text(`Created: ${new Date(po.created_at).toLocaleString()}`);
  doc.moveDown();

  doc.text(`Part: ${po.part_name}`);
  doc.text(`Quantity: ${po.quantity}`);
  doc.text(`Total Value: ₹ ${Number(po.value).toLocaleString()}`);

  doc.end();
});


/* =========================================================
   REQUEST PAYMENT (BUYER INITIATED)
   - No direct financial execution
   - Creates approval workflow record
========================================================= */
exports.requestPayment = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const milestoneId = Number(req.params.milestoneId);
  const amount = Number(req.body.amount);

  const orgId = req.user.organization_id;
  const userId = req.user.id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  if (!milestoneId || isNaN(milestoneId))
    throw new AppError("Invalid milestone id", 400);

  if (!amount || isNaN(amount) || amount <= 0)
    throw new AppError("Invalid payment amount", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poRes = await client.query(
      `SELECT value, buyer_org_id
       FROM purchase_orders
       WHERE id = $1
       FOR UPDATE`,
      [poId]
    );

    if (!poRes.rowCount)
      throw new AppError("PO not found", 404);

    if (poRes.rows[0].buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    const expectedAmount = Number(poRes.rows[0].value);

    if (Math.abs(amount - expectedAmount) > 0.01)
      throw new AppError("Payment amount mismatch", 400);

    /* Prevent duplicate active request */
    const existing = await client.query(
      `SELECT id FROM payment_requests
       WHERE po_id = $1
       AND milestone_id = $2
       AND status = 'PENDING'
       FOR UPDATE`,
      [poId, milestoneId]
    );

    if (existing.rowCount > 0)
      throw new AppError("Payment request already pending", 400);

    await client.query(
      `INSERT INTO payment_requests
       (po_id, milestone_id, organization_id,
        requested_by, amount)
       VALUES ($1,$2,$3,$4,$5)`,
      [poId, milestoneId, orgId, userId, amount]
    );

    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.PAYMENT_REQUESTED,
      description: "Payment approval requested",
      actorUserId: userId,
      organizationId: orgId,
      actorRole: req.user.role,
      metadata: { amount }
    });

    await createNotification(client, {
  organizationId: orgId,
  role: "finance",
  title: "Payment Approval Required",
  message: `Payment request submitted for PO ${poId}`,
  type: "PAYMENT_REQUEST",
  referenceType: "purchase_orders",
  referenceId: poId
});

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Payment request submitted for approval"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

});

/* =========================================================
   APPROVE PAYMENT (FINANCE ROLE)
========================================================= */
exports.approvePaymentRequest = asyncHandler(async (req, res) => {

  const requestId = Number(req.params.id);
  const approverId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestRes = await client.query(
      `SELECT * FROM payment_requests
       WHERE id = $1
       FOR UPDATE`,
      [requestId]
    );

    if (!requestRes.rowCount)
      throw new AppError("Payment request not found", 404);

    const request = requestRes.rows[0];

    if (request.status !== "PENDING")
      throw new AppError("Request already processed", 400);

    /* Mark approved */
    await client.query(
      `UPDATE payment_requests
       SET status = 'APPROVED',
           approved_by = $1,
           approved_at = NOW()
       WHERE id = $2`,
      [approverId, requestId]
    );

    /* Now execute real payment */
    await client.query(
      `INSERT INTO payments
       (po_id, milestone_id, amount, status,
        paid_at, paid_by_user_id,
        organization_id, created_at)
       VALUES ($1,$2,$3,'paid',NOW(),$4,$5,NOW())`,
      [
        request.po_id,
        request.milestone_id,
        request.amount,
        approverId,
        request.organization_id
      ]
    );

    await client.query(
      `UPDATE purchase_orders
       SET status = $1
       WHERE id = $2`,
      [PO_STATUS.COMPLETED, request.po_id]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Payment approved and executed"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

});

exports.getNotifications = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;
  const userId = req.user.id;
  const role = req.user.role;

  const result = await pool.query(
    `
    SELECT *
    FROM notifications
    WHERE organization_id = $1
    AND (user_id = $2 OR role = $3)
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [orgId, userId, role]
  );

  res.status(200).json({
    success: true,
    data: result.rows
  });

});

exports.markNotificationRead = asyncHandler(async (req, res) => {

  const id = Number(req.params.id);

  await pool.query(
    `UPDATE notifications SET is_read = true WHERE id = $1`,
    [id]
  );

  res.status(200).json({
    success: true
  });

});

/* =========================================================
   PROCUREMENT ANALYTICS OVERVIEW
   - Executive dashboard metrics
   - Optimized aggregations
========================================================= */
exports.getAnalyticsOverview = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;
  if (!orgId)
    throw new AppError("Organization not found", 400);

  const client = await pool.connect();

  try {

    /* -------------------------
       Core PO Metrics
    --------------------------*/
    const poStats = await client.query(
      `
      SELECT 
        COUNT(*)::INT AS total_pos,
        COUNT(*) FILTER (WHERE status IN ('ISSUED','ACCEPTED','IN_PROGRESS'))::INT AS active_pos,
        COUNT(*) FILTER (WHERE status = 'DISPUTED')::INT AS disputed_pos,
        COALESCE(SUM(value),0)::NUMERIC AS total_spend
      FROM purchase_orders
      WHERE buyer_org_id = $1
      `,
      [orgId]
    );

    /* -------------------------
       Payment Summary
    --------------------------*/
    const paymentStats = await client.query(
      `
      SELECT 
        COALESCE(SUM(p.amount),0)::NUMERIC AS total_paid
      FROM payments p
      JOIN purchase_orders po ON p.po_id = po.id
      WHERE po.buyer_org_id = $1
      `,
      [orgId]
    );

    const totalSpend = Number(poStats.rows[0].total_spend);
    const totalPaid = Number(paymentStats.rows[0].total_paid);
    const balance = totalSpend - totalPaid;

    /* -------------------------
       Monthly Spend Trend (Last 6 Months)
    --------------------------*/
    const monthlySpend = await client.query(
      `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        SUM(value)::NUMERIC AS amount
      FROM purchase_orders
      WHERE buyer_org_id = $1
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
      `,
      [orgId]
    );

    /* -------------------------
       Status Distribution
    --------------------------*/
    const statusDist = await client.query(
      `
      SELECT 
        status,
        COUNT(*)::INT AS count
      FROM purchase_orders
      WHERE buyer_org_id = $1
      GROUP BY status
      `,
      [orgId]
    );

    res.status(200).json({
      success: true,
      message: "Analytics overview fetched",
      data: {
        total_spend: totalSpend,
        total_pos: poStats.rows[0].total_pos,
        active_pos: poStats.rows[0].active_pos,
        disputed_pos: poStats.rows[0].disputed_pos,
        total_paid: totalPaid,
        outstanding_balance: balance,
        monthly_spend: monthlySpend.rows,
        status_distribution: statusDist.rows
      }
    });

  } finally {
    client.release();
  }

});