/* =========================================================
   AXO NETWORKS — BUYER ORDERS SERVICE (HARDENED)
   - Transaction Safe
   - Event Logged
   - Reliability Triggered
   - Notification Automated
========================================================= */

const pool = require("../../../config/db");
const AppError = require("../../../utils/AppError");
const queries = require("./buyer.orders.queries");

const {
  logDisputeRaised,
  logPaymentConfirmed
} = require("../../../utils/eventLogger");

const { createNotification } = require("../../../utils/notificationService");

const { calculateSupplierScore } = require("../../../utils/reliability.service");

/* =========================================================
   GET BUYER ORDERS
========================================================= */
exports.getBuyerOrders = async (buyerOrgId) => {
  return queries.getBuyerOrders(buyerOrgId);
};

/* =========================================================
   GET FULL PO THREAD
========================================================= */
exports.getFullOrderThread = async ({
  poId,
  buyerOrgId
}) => {

  const po = await queries.getPOById(poId);

  if (!po)
    throw new AppError("Purchase Order not found.", 404);

  if (po.buyer_org_id !== buyerOrgId)
    throw new AppError("Access denied.", 403);

  const events = await queries.getEvents(poId);

  const timeline = buildTimeline(events);

  return {
    po,
    timeline,
    events
  };
};

/* =========================================================
   RAISE DISPUTE (TRANSACTION SAFE)
========================================================= */
exports.raiseDispute = async ({
  poId,
  buyerOrgId,
  userId,
  reason
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    /* -------------------------
       Validate Ownership
    -------------------------- */
    const po = await queries.getPOById(poId);

    if (!po)
      throw new AppError("PO not found.", 404);

    if (po.buyer_org_id !== buyerOrgId)
      throw new AppError("Access denied.", 403);

    /* -------------------------
       Insert Dispute
    -------------------------- */
    const disputeRes = await client.query(
      `
      INSERT INTO po_disputes (po_id, reason, raised_by, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
      `,
      [poId, reason, userId]
    );

    const disputeId = disputeRes.rows[0].id;

    /* -------------------------
       Log Behavioral Event
    -------------------------- */
    await logDisputeRaised(poId, userId, disputeId, client);

    /* -------------------------
       Notify Supplier
    -------------------------- */
    await createNotification(client, {
      organizationId: po.supplier_org_id,
      title: "Dispute Raised",
      message: `A dispute has been raised on PO #${poId}`,
      type: "DISPUTE",
      referenceType: "PO",
      referenceId: poId
    });

    /* -------------------------
       Recalculate Reliability
    -------------------------- */
    await calculateSupplierScore(po.supplier_org_id, client);

    await client.query("COMMIT");

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();
  }
};

/* =========================================================
   CONFIRM PAYMENT (HARDENED FLOW)
========================================================= */
exports.confirmPayment = async ({
  poId,
  buyerOrgId,
  userId,
  amount
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const po = await queries.getPOById(poId);

    if (!po)
      throw new AppError("PO not found.", 404);

    if (po.buyer_org_id !== buyerOrgId)
      throw new AppError("Access denied.", 403);

    /* -------------------------
       Insert Payment Record
    -------------------------- */
    await client.query(
      `
      INSERT INTO payments (po_id, amount, paid_by, created_at)
      VALUES ($1,$2,$3,NOW())
      `,
      [poId, amount, userId]
    );

    /* -------------------------
       Log Behavioral Event
    -------------------------- */
    await logPaymentConfirmed(poId, userId, amount, client);

    /* -------------------------
       Notify Supplier
    -------------------------- */
    await createNotification(client, {
      organizationId: po.supplier_org_id,
      title: "Payment Confirmed",
      message: `Payment of ${amount} confirmed for PO #${poId}`,
      type: "PAYMENT",
      referenceType: "PO",
      referenceId: poId
    });

    /* -------------------------
       Recalculate Reliability
    -------------------------- */
    await calculateSupplierScore(po.supplier_org_id, client);

    await client.query("COMMIT");

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();
  }
};

/* =========================================================
   PDF GENERATOR (PLACEHOLDER SAFE)
========================================================= */
exports.generatePOPdf = async (poId) => {
  return {
    poId,
    status: "PDF generation placeholder"
  };
};

/* =========================================================
   TIMELINE BUILDER
========================================================= */
function buildTimeline(events) {

  const stages = [
    "PO_ACCEPTED",
    "RAW_MATERIAL_ORDERED",
    "PRODUCTION_STARTED",
    "QC",
    "DISPATCH",
    "DELIVERED",
    "INVOICE_RAISED",
    "PAID"
  ];

  return stages.map(stage => {

    const event = events.find(e => e.event_type === stage);

    return {
      stage,
      completed: !!event,
      completed_at: event ? event.created_at : null
    };

  });
}/* =========================================================
   AXO NETWORKS — BUYER ORDERS SERVICE (INTELLIGENCE LAYER)
   - Transaction Safe
   - Behavioral Logging
   - Reliability Driven
   - Guardrail Protected
   - Auto Risk Scored
========================================================= */




const {
  logMilestoneUpdate,
  logEvent
} = require("../../../utils/eventLogger");



/* =========================================================
   STATE TRANSITION GUARDRAIL MAP
========================================================= */

const ALLOWED_TRANSITIONS = {
  issued: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed"],
  completed: [],
  disputed: ["completed"],
  cancelled: []
};

/* =========================================================
   GET BUYER ORDERS
========================================================= */
exports.getBuyerOrders = async (buyerOrgId) => {
  return queries.getBuyerOrders(buyerOrgId);
};

/* =========================================================
   UPDATE PO STATUS (GUARDRAILED)
========================================================= */
exports.updatePOStatus = async ({
  poId,
  buyerOrgId,
  newStatus,
  userId
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const po = await queries.getPOById(poId);

    if (!po)
      throw new AppError("PO not found.", 404);

    if (po.buyer_org_id !== buyerOrgId)
      throw new AppError("Access denied.", 403);

    const allowed = ALLOWED_TRANSITIONS[po.status] || [];

    if (!allowed.includes(newStatus))
      throw new AppError("Invalid state transition.", 400);

    await client.query(
      `UPDATE purchase_orders SET status = $1 WHERE id = $2`,
      [newStatus, poId]
    );

    await logEvent({
      entityType: "PO",
      entityId: poId,
      eventType: "PO_STATUS_UPDATED",
      actorId: userId,
      metadata: { from: po.status, to: newStatus },
      client
    });

    await calculateSupplierScore(po.supplier_org_id, client);

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================
   AUTO MILESTONE DISCIPLINE LOGGER
========================================================= */
exports.updateMilestone = async ({
  poId,
  milestoneName,
  userId
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    await logMilestoneUpdate(poId, userId, milestoneName, client);

    /* Discipline logging for reliability */
    await logEvent({
      entityType: "PO",
      entityId: poId,
      eventType: "MILESTONE_DISCIPLINE_LOGGED",
      actorId: userId,
      metadata: { milestoneName },
      client
    });

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================
   RESPONSE TIME MEASUREMENT ENGINE
========================================================= */
exports.recordResponseTime = async ({
  poId,
  actorId,
  hours
}) => {

  await logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "RESPONSE_TIME_RECORDED",
    actorId,
    metadata: { response_time_hours: hours }
  });
};

/* =========================================================
   DISPUTE WITH AUTO RISK + RELIABILITY
========================================================= */
exports.raiseDispute = async ({
  poId,
  buyerOrgId,
  userId,
  reason
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const po = await queries.getPOById(poId);

    if (!po)
      throw new AppError("PO not found.", 404);

    if (po.buyer_org_id !== buyerOrgId)
      throw new AppError("Access denied.", 403);

    const disputeRes = await client.query(
      `
      INSERT INTO po_disputes (po_id, reason, raised_by, created_at)
      VALUES ($1,$2,$3,NOW())
      RETURNING id
      `,
      [poId, reason, userId]
    );

    const disputeId = disputeRes.rows[0].id;

    await logDisputeRaised(poId, userId, disputeId, client);

    await createNotification(client, {
      organizationId: po.supplier_org_id,
      title: "Dispute Raised",
      message: `Dispute raised on PO #${poId}`,
      type: "DISPUTE",
      referenceType: "PO",
      referenceId: poId
    });

    await calculateSupplierScore(po.supplier_org_id, client);

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================
   PAYMENT CONFIRMATION WITH RISK + RELIABILITY
========================================================= */
exports.confirmPayment = async ({
  poId,
  buyerOrgId,
  userId,
  amount
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const po = await queries.getPOById(poId);

    if (!po)
      throw new AppError("PO not found.", 404);

    if (po.buyer_org_id !== buyerOrgId)
      throw new AppError("Access denied.", 403);

    await client.query(
      `INSERT INTO payments (po_id, amount, paid_by, created_at)
       VALUES ($1,$2,$3,NOW())`,
      [poId, amount, userId]
    );

    await logPaymentConfirmed(poId, userId, amount, client);

    await createNotification(client, {
      organizationId: po.supplier_org_id,
      title: "Payment Confirmed",
      message: `Payment of ${amount} confirmed.`,
      type: "PAYMENT",
      referenceType: "PO",
      referenceId: poId
    });

    await calculateSupplierScore(po.supplier_org_id, client);

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================
   AUTOMATIC RISK SCORING
========================================================= */
exports.calculateRiskLevel = (po, events) => {

  let flags = [];

  const delivered = events.find(e => e.event_type === "DELIVERY_CONFIRMED");

  if (!delivered && po.promised_delivery_date) {
    if (new Date() > new Date(po.promised_delivery_date)) {
      flags.push("DELIVERY_OVERDUE");
    }
  }

  if (events.some(e => e.event_type === "DISPUTE_RAISED")) {
    flags.push("DISPUTE_ACTIVE");
  }

  return {
    level: flags.length ? "HIGH" : "NORMAL",
    flags
  };
};

/* =========================================================
   REAL-TIME RISK DASHBOARD AGGREGATION
========================================================= */

exports.aggregateRiskDashboard = async (buyerOrgId) => {

  const poRes = await pool.query(
    `
    SELECT id, promised_delivery_date, status
    FROM purchase_orders
    WHERE buyer_org_id = $1
    `,
    [buyerOrgId]
  );

  const now = new Date();

  let overdue = 0;
  let disputed = 0;
  let active = 0;

  for (const po of poRes.rows) {

    if (po.status === "in_progress")
      active++;

    if (po.status === "disputed")
      disputed++;

    if (
      po.promised_delivery_date &&
      new Date(po.promised_delivery_date) < now &&
      po.status !== "completed"
    ) {
      overdue++;
    }
  }

  return {
    total_pos: poRes.rows.length,
    active_pos: active,
    overdue_pos: overdue,
    disputed_pos: disputed,
    risk_level:
      overdue > 3 || disputed > 2
        ? "HIGH"
        : "NORMAL"
  };
};

/* =========================================================
   ANOMALY DETECTION ENGINE
========================================================= */

exports.detectAnomalies = async (organizationId, roleType) => {

  const poRes = await pool.query(
    `
    SELECT id
    FROM purchase_orders
    WHERE ${roleType === "supplier"
      ? "supplier_org_id"
      : "buyer_org_id"} = $1
    `,
    [organizationId]
  );

  const poIds = poRes.rows.map(p => p.id);

  if (!poIds.length)
    return { anomalies: [] };

  const eventRes = await pool.query(
    `
    SELECT event_type
    FROM po_events
    WHERE entity_id = ANY($1)
    `,
    [poIds]
  );

  const events = eventRes.rows;

  let disputeCount = 0;
  let cancellations = 0;

  for (const e of events) {

    if (e.event_type === "DISPUTE_RAISED")
      disputeCount++;

    if (e.event_type === "PO_CANCELLED")
      cancellations++;
  }

  const anomalies = [];

  if (disputeCount > 5)
    anomalies.push("HIGH_DISPUTE_FREQUENCY");

  if (cancellations > 3)
    anomalies.push("EXCESSIVE_CANCELLATIONS");

  return {
    anomalies
  };
};