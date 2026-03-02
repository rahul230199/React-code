/* =========================================================
   AXO NETWORKS — BUYER CONTROLLER (FINAL ENTERPRISE)
   Scope:
   - Dashboard
   - Quote Decision
   - PO Lifecycle
   - Payments
   - Disputes
   - Notifications
   - Analytics
   RFQ handled in /rfqs module
========================================================= */

const pool = require("../../config/db");
const PO_STATUS = require("../../constants/poStatus.constants");
const EVENT_TYPES = require("../../constants/eventTypes.constants");
const { logPoEvent } = require("../../utils/auditLogger");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");
const PDFDocument = require("pdfkit");
const { createNotification } = require("../../utils/notificationService");

/* =========================================================
   DASHBOARD STATS
========================================================= */
exports.getDashboardStats = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;
  if (!orgId) throw new AppError("Organization not found", 400);

  const [rfqStats, poStats] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::INT AS total_rfq,
              COUNT(*) FILTER (WHERE status='open')::INT AS active_rfq
       FROM rfqs WHERE buyer_org_id=$1`,
      [orgId]
    ),
    pool.query(
      `SELECT COUNT(*)::INT AS total_orders,
              COUNT(*) FILTER (
                WHERE status IN ($2,$3,$4)
              )::INT AS pending_orders
       FROM purchase_orders
       WHERE buyer_org_id=$1`,
      [orgId, PO_STATUS.ISSUED, PO_STATUS.ACCEPTED, PO_STATUS.IN_PROGRESS]
    )
  ]);

  res.status(200).json({
    success: true,
    data: {
      total_rfq: rfqStats.rows[0].total_rfq,
      active_rfq: rfqStats.rows[0].active_rfq,
      total_orders: poStats.rows[0].total_orders,
      pending_orders: poStats.rows[0].pending_orders
    }
  });
});

/* =========================================================
   ACCEPT QUOTE → CREATE PO
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
      `SELECT * FROM quotes WHERE id=$1 FOR UPDATE`,
      [quoteId]
    );
    if (!quoteRes.rowCount)
      throw new AppError("Quote not found", 404);

    const quote = quoteRes.rows[0];

    const rfqRes = await client.query(
      `SELECT * FROM rfqs WHERE id=$1`,
      [quote.rfq_id]
    );
    if (!rfqRes.rowCount)
      throw new AppError("RFQ not found", 404);

    const rfq = rfqRes.rows[0];

    if (rfq.buyer_org_id !== orgId)
      throw new AppError("Unauthorized", 403);

    if (quote.status === "accepted")
      throw new AppError("Quote already accepted", 400);

    await client.query(
      `UPDATE quotes SET status='accepted' WHERE id=$1`,
      [quoteId]
    );

    await client.query(
      `UPDATE quotes SET status='rejected'
       WHERE rfq_id=$1 AND id!=$2`,
      [quote.rfq_id, quoteId]
    );

    const poNumber = `PO-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    let promisedDeliveryDate = null;
    if (quote.timeline_days) {
      const d = new Date();
      d.setDate(d.getDate() + Number(quote.timeline_days));
      promisedDeliveryDate = d;
    }

    const poRes = await client.query(
      `INSERT INTO purchase_orders
       (po_number, rfq_id, quote_id,
        buyer_org_id, supplier_org_id,
        part_name, quantity, value,
        status, accepted_at, promised_delivery_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10)
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
        PO_STATUS.ISSUED,
        promisedDeliveryDate
      ]
    );

    await logPoEvent(client, {
      poId: poRes.rows[0].id,
      eventType: EVENT_TYPES.PO_CREATED,
      description: "PO created from accepted quote",
      actorUserId: req.user.id,
      organizationId: orgId,
      actorRole: req.user.role
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
   REJECT QUOTE
========================================================= */
exports.rejectQuote = asyncHandler(async (req, res) => {

  const quoteId = Number(req.params.id);
  const orgId = req.user.organization_id;

  if (!quoteId || isNaN(quoteId))
    throw new AppError("Invalid quote id", 400);

  const result = await pool.query(
    `UPDATE quotes q
     SET status='rejected'
     FROM rfqs r
     WHERE q.id=$1
       AND q.rfq_id=r.id
       AND r.buyer_org_id=$2
       AND q.status!='accepted'
     RETURNING q.id`,
    [quoteId, orgId]
  );

  if (!result.rowCount)
    throw new AppError("Quote not found or unauthorized", 404);

  res.status(200).json({ success: true });
});

/* =========================================================
   APPROVE PAYMENT REQUEST
========================================================= */
exports.approvePaymentRequest = asyncHandler(async (req, res) => {

  const requestId = Number(req.params.id);
  const orgId = req.user.organization_id;

  if (!requestId || isNaN(requestId))
    throw new AppError("Invalid request id", 400);

  const result = await pool.query(
    `UPDATE payment_requests
     SET status='APPROVED',
         approved_by=$1,
         approved_at=NOW()
     WHERE id=$2
       AND organization_id=$3
       AND status='PENDING'
     RETURNING *`,
    [req.user.id, requestId, orgId]
  );

  if (!result.rowCount)
    throw new AppError("Request not found or already processed", 404);

  res.status(200).json({ success: true });
});

/* =========================================================
   NOTIFICATIONS
========================================================= */
exports.getNotifications = asyncHandler(async (req, res) => {

  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE organization_id=$1
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.user.organization_id]
  );

  res.status(200).json({
    success: true,
    data: result.rows
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {

  const id = Number(req.params.id);

  await pool.query(
    `UPDATE notifications
     SET is_read=true
     WHERE id=$1
       AND organization_id=$2`,
    [id, req.user.organization_id]
  );

  res.status(200).json({ success: true });
});

/* =========================================================
   ANALYTICS OVERVIEW
========================================================= */
exports.getAnalyticsOverview = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;

  const stats = await pool.query(
    `SELECT
       COUNT(*)::INT AS total_pos,
       COALESCE(SUM(value),0)::NUMERIC AS total_spend
     FROM purchase_orders
     WHERE buyer_org_id=$1`,
    [orgId]
  );

  res.status(200).json({
    success: true,
    data: stats.rows[0]
  });
});