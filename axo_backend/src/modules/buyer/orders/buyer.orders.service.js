/* =========================================================
   AXO NETWORKS — ORDERS SERVICE (FINAL ENTERPRISE CORE)
   Multi-Tenant | Milestone Driven | Communication Enabled
   Production Ready | Transaction Safe | Reliability Aware
========================================================= */

const pool = require("../../../config/db");
const AppError = require("../../../utils/AppError");
const queries = require("./buyer.orders.queries");

const {
  logEvent,
  logDisputeRaised,
  logPaymentConfirmed
} = require("../../../utils/eventLogger");

const { createNotification } = require("../../../utils/notificationService");
const { calculateSupplierScore } = require("../../../utils/reliability.service");

/* =========================================================
   ROLE VALIDATION
========================================================= */

function validatePOAccess(po, user) {
  if (!po) throw new AppError("Purchase Order not found.", 404);

  const { role, organization_id } = user;

  if (role === "admin" || role === "super_admin") return;

  if (role === "buyer" && po.buyer_org_id === organization_id) return;

  if (role === "supplier" && po.supplier_org_id === organization_id) return;

  throw new AppError("Access denied.", 403);
}

/* =========================================================
   GET ORDERS
========================================================= */

exports.getOrders = async (user) => {

  if (user.role === "admin" || user.role === "super_admin")
    return queries.getAllOrders();

  if (user.role === "buyer")
    return queries.getBuyerOrders(user.organization_id);

  if (user.role === "supplier")
    return queries.getSupplierOrders(user.organization_id);

  return [];
};

/* =========================================================
   GET FULL PO THREAD (DB-Driven Timeline)
========================================================= */

exports.getFullOrderThread = async ({ poId, user }) => {

  const po = await queries.getPOById(poId);
  validatePOAccess(po, user);

  const milestones = await queries.getMilestones(poId);
  const messages = await queries.getMessages(poId);
  const events = await queries.getEvents(poId);

  const timeline = buildTimelineFromMilestones(milestones);

  return {
    po,
    timeline,
    milestones,
    messages,
    events
  };
};

/* =========================================================
   STATUS TRANSITION MAP
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
   UPDATE PO STATUS
========================================================= */

exports.updatePOStatus = async ({ poId, newStatus, user }) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const po = await queries.getPOById(poId, client);
    validatePOAccess(po, user);

    const allowed = ALLOWED_TRANSITIONS[po.status] || [];

    if (!allowed.includes(newStatus))
      throw new AppError("Invalid state transition.", 400);

    await queries.updatePOStatus(poId, newStatus, client);

    await logEvent({
      entityType: "PO",
      entityId: poId,
      eventType: "PO_STATUS_UPDATED",
      actorId: user.id,
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
   COMPLETE MILESTONE (FULL CRUD)
========================================================= */

exports.completeMilestone = async ({
  poId,
  milestoneName,
  evidence_url,
  remarks,
  user
}) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const po = await queries.getPOById(poId, client);
    validatePOAccess(po, user);

    await queries.completeMilestone(
      poId,
      milestoneName,
      evidence_url,
      remarks,
      client
    );

    await logEvent({
      entityType: "PO",
      entityId: poId,
      eventType: "MILESTONE_COMPLETED",
      actorId: user.id,
      metadata: { milestoneName },
      client
    });

    /* Auto complete logic */
    const milestones = await queries.getMilestones(poId, client);

    const allCompleted = milestones.every(m => m.status === "completed");

    if (allCompleted && po.status !== "completed") {

      await queries.updatePOStatus(poId, "completed", client);
      await queries.setActualDeliveryDate(poId, client);

      await logEvent({
        entityType: "PO",
        entityId: poId,
        eventType: "PO_AUTO_COMPLETED",
        actorId: user.id,
        metadata: {},
        client
      });
    }

    const milestone = milestones.find(m => m.milestone_name === milestoneName);

if (milestone?.due_date && milestone.completed_at) {
  const due = new Date(milestone.due_date);
  const completed = new Date(milestone.completed_at);

  if (completed > due) {
    await client.query(`
      INSERT INTO sla_breaches 
      (po_id, milestone_id, supplier_org_id, breach_type, due_date, completed_at)
      VALUES ($1,$2,$3,'LATE_COMPLETION',$4,$5)
    `, [
      poId,
      milestone.id,
      po.supplier_org_id,
      milestone.due_date,
      milestone.completed_at
    ]);
  }
}

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
   MESSAGE THREAD
========================================================= */

exports.sendMessage = async ({ poId, message, user }) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const po = await queries.getPOById(poId, client);
    validatePOAccess(po, user);

    await queries.insertMessage(poId, user.id, message, client);

    await logEvent({
      entityType: "PO",
      entityId: poId,
      eventType: "MESSAGE_SENT",
      actorId: user.id,
      metadata: {},
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
   CONFIRM PAYMENT
========================================================= */

exports.confirmPayment = async ({ poId, amount, user }) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const po = await queries.getPOById(poId, client);
    validatePOAccess(po, user);

    await queries.insertPayment(poId, amount, user.id, client);

    await logPaymentConfirmed(poId, user.id, amount, client);

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
   RAISE DISPUTE (AUTO FLAG)
========================================================= */

exports.raiseDispute = async ({ poId, reason, user }) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const po = await queries.getPOById(poId, client);
    validatePOAccess(po, user);

    const disputeId = await queries.insertDispute(
      poId,
      reason,
      user.id,
      client
    );

    await queries.setDisputeFlag(poId, client);

    await logDisputeRaised(poId, user.id, disputeId, client);

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
   PDF DATA AGGREGATION
========================================================= */

exports.generatePOPdfData = async (poId, user) => {

  const po = await queries.getPOById(poId);
  validatePOAccess(po, user);

  return await queries.getFullPOPackage(poId);
};

/* =========================================================
   TIMELINE FROM MILESTONES
========================================================= */

function buildTimelineFromMilestones(milestones) {

  return milestones.map(m => ({
    stage: m.milestone_name,
    status: m.status,
    due_date: m.due_date,
    completed_at: m.completed_at,
    is_overdue:
      m.status !== "completed" &&
      m.due_date &&
      new Date(m.due_date) < new Date()
  }));
}

/* =========================================================
   SLA RISK ENGINE
========================================================= */

exports.calculateSLARisk = async (poId, user) => {

  const po = await queries.getPOById(poId);
  validatePOAccess(po, user);

  const milestones = await queries.getMilestones(poId);

  const today = new Date();

  let high = 0;
  let warning = 0;
  let breaches = 0;

  for (const m of milestones) {

    if (!m.due_date) continue;

    const due = new Date(m.due_date);

    if (m.status !== "completed" && due < today) {
      high++;
    }

    if (m.status !== "completed") {
      const diffDays = (due - today) / (1000 * 60 * 60 * 24);
      if (diffDays > 0 && diffDays <= 2) {
        warning++;
      }
    }

    if (m.completed_at && due < new Date(m.completed_at)) {
      breaches++;
    }
  }

  let riskLevel = "SAFE";

  if (high >= 2) riskLevel = "CRITICAL";
  else if (high >= 1) riskLevel = "HIGH";
  else if (warning >= 1) riskLevel = "WATCH";

  return {
    po_id: poId,
    risk_level: riskLevel,
    overdue_milestones: high,
    warning_milestones: warning,
    sla_breaches: breaches
  };
};

/* =========================================================
   GLOBAL SLA DASHBOARD
========================================================= */

exports.aggregateSLARisk = async (user) => {

  const orders = await exports.getOrders(user);

  const results = [];

  for (const po of orders) {
    const risk = await exports.calculateSLARisk(po.id, user);
    results.push(risk);
  }

  const critical = results.filter(r => r.risk_level === "CRITICAL").length;
  const high = results.filter(r => r.risk_level === "HIGH").length;
  const watch = results.filter(r => r.risk_level === "WATCH").length;

  return {
    total_pos: results.length,
    critical,
    high,
    watch
  };
};

exports.checkOverdueMilestones = async () => {

  const res = await pool.query(`
    SELECT m.*, po.supplier_org_id
    FROM po_milestones m
    JOIN purchase_orders po ON po.id = m.po_id
    WHERE m.status != 'completed'
      AND m.due_date < CURRENT_DATE
  `);

  for (const row of res.rows) {

    await createNotification(pool, {
      organizationId: row.supplier_org_id,
      title: "Milestone Overdue",
      message: `Milestone ${row.milestone_name} is overdue.`,
      type: "SLA_OVERDUE",
      referenceType: "PO",
      referenceId: row.po_id
    });

    await pool.query(`
      INSERT INTO sla_breaches 
      (po_id, milestone_id, supplier_org_id, breach_type, due_date)
      VALUES ($1,$2,$3,'OVERDUE',$4)
      ON CONFLICT DO NOTHING
    `, [
      row.po_id,
      row.id,
      row.supplier_org_id,
      row.due_date
    ]);
  }
};