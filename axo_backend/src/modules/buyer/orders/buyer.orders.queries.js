/* =========================================================
   AXO NETWORKS — ORDERS QUERIES (FINAL ENTERPRISE v3)
   Milestone Driven | SLA Enabled | PDF Ready
========================================================= */

const pool = require("../../../config/db");

/* =========================================================
   LIST — BUYER
========================================================= */
exports.getBuyerOrders = async (buyerOrgId) => {

  const res = await pool.query(`
    SELECT
      po.id,
      po.po_number,
      po.status,
      po.value,
      po.promised_delivery_date,
      po.actual_delivery_date,
      po.created_at,
      o.company_name AS supplier_name
    FROM purchase_orders po
    JOIN organizations o
      ON o.id = po.supplier_org_id
    WHERE po.buyer_org_id = $1
    ORDER BY po.created_at DESC
  `, [buyerOrgId]);

  return res.rows;
};

/* =========================================================
   LIST — SUPPLIER
========================================================= */
exports.getSupplierOrders = async (supplierOrgId) => {

  const res = await pool.query(`
    SELECT
      po.id,
      po.po_number,
      po.status,
      po.value,
      po.promised_delivery_date,
      po.actual_delivery_date,
      po.created_at,
      o.company_name AS buyer_name
    FROM purchase_orders po
    JOIN organizations o
      ON o.id = po.buyer_org_id
    WHERE po.supplier_org_id = $1
    ORDER BY po.created_at DESC
  `, [supplierOrgId]);

  return res.rows;
};

/* =========================================================
   LIST — ADMIN
========================================================= */
exports.getAllOrders = async () => {

  const res = await pool.query(`
    SELECT
      po.id,
      po.po_number,
      po.status,
      po.value,
      po.promised_delivery_date,
      po.actual_delivery_date,
      po.created_at,
      b.company_name AS buyer_name,
      s.company_name AS supplier_name
    FROM purchase_orders po
    JOIN organizations b ON b.id = po.buyer_org_id
    JOIN organizations s ON s.id = po.supplier_org_id
    ORDER BY po.created_at DESC
  `);

  return res.rows;
};

/* =========================================================
   FETCH SINGLE PO
========================================================= */
exports.getPOById = async (poId, client = pool) => {

  const res = await client.query(
    `SELECT * FROM purchase_orders WHERE id = $1`,
    [poId]
  );

  return res.rows[0];
};

/* =========================================================
   UPDATE PO STATUS
========================================================= */
exports.updatePOStatus = async (poId, newStatus, client) => {

  await client.query(`
    UPDATE purchase_orders
    SET status = $1,
        updated_at = NOW()
    WHERE id = $2
  `, [newStatus, poId]);
};

/* =========================================================
   AUTO DELIVERY DATE
========================================================= */
exports.setActualDeliveryDate = async (poId, client) => {

  await client.query(`
    UPDATE purchase_orders
    SET actual_delivery_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = $1
  `, [poId]);
};

/* =========================================================
   AUTO DISPUTE FLAG
========================================================= */
exports.setDisputeFlag = async (poId, client) => {

  await client.query(`
    UPDATE purchase_orders
    SET dispute_flag = true,
        updated_at = NOW()
    WHERE id = $1
  `, [poId]);
};

/* =========================================================
   INSERT PAYMENT
========================================================= */
exports.insertPayment = async (poId, amount, userId, client) => {

  await client.query(`
    INSERT INTO payments (po_id, amount, paid_by, created_at)
    VALUES ($1,$2,$3,NOW())
  `, [poId, amount, userId]);
};

/* =========================================================
   INSERT DISPUTE
========================================================= */
exports.insertDispute = async (poId, reason, userId, client) => {

  const res = await client.query(`
    INSERT INTO po_disputes (po_id, reason, raised_by, created_at)
    VALUES ($1,$2,$3,NOW())
    RETURNING id
  `, [poId, reason, userId]);

  return res.rows[0].id;
};

/* =========================================================
   MILESTONES
========================================================= */
exports.getMilestones = async (poId, client = pool) => {

  const res = await client.query(`
    SELECT *
    FROM po_milestones
    WHERE po_id = $1
    ORDER BY sequence_order ASC
  `, [poId]);

  return res.rows;
};

exports.completeMilestone = async (
  poId,
  milestoneName,
  evidence_url,
  remarks,
  client
) => {

  await client.query(`
    UPDATE po_milestones
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW(),
        evidence_url = $1,
        remarks = $2
    WHERE po_id = $3
      AND milestone_name = $4
  `, [evidence_url, remarks, poId, milestoneName]);
};

/* =========================================================
   MESSAGE THREAD
========================================================= */
exports.getMessages = async (poId) => {

  const res = await pool.query(`
    SELECT m.*, u.role
    FROM po_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.po_id = $1
    ORDER BY m.created_at ASC
  `, [poId]);

  return res.rows;
};

exports.insertMessage = async (poId, senderId, message, client) => {

  await client.query(`
    INSERT INTO po_messages (po_id, sender_id, message)
    VALUES ($1,$2,$3)
  `, [poId, senderId, message]);
};

/* =========================================================
   EVENTS
========================================================= */
exports.getEvents = async (poId, client = pool) => {

  const res = await client.query(`
    SELECT
      event_type,
      actor_user_id,
      actor_role,
      metadata,
      event_timestamp AS created_at
    FROM po_events
    WHERE po_id = $1
    ORDER BY event_timestamp ASC
  `, [poId]);

  return res.rows;
};

/* =========================================================
   PDF DATA PACKAGE
========================================================= */
exports.getFullPOPackage = async (poId) => {

  const po = await pool.query(
    `SELECT * FROM purchase_orders WHERE id = $1`,
    [poId]
  );

  const milestones = await exports.getMilestones(poId);
  const messages = await exports.getMessages(poId);
  const events = await exports.getEvents(poId);

  const payments = await pool.query(
    `SELECT * FROM payments WHERE po_id = $1`,
    [poId]
  );

  const disputes = await pool.query(
    `SELECT * FROM po_disputes WHERE po_id = $1`,
    [poId]
  );

  return {
    po: po.rows[0],
    milestones,
    messages,
    events,
    payments: payments.rows,
    disputes: disputes.rows
  };
};

/* =========================================================
   PO IDS HELPERS
========================================================= */
exports.getBuyerPOIds = async (buyerOrgId) => {
  const res = await pool.query(
    `SELECT id FROM purchase_orders WHERE buyer_org_id = $1`,
    [buyerOrgId]
  );
  return res.rows.map(r => r.id);
};

exports.getSupplierPOIds = async (supplierOrgId) => {
  const res = await pool.query(
    `SELECT id FROM purchase_orders WHERE supplier_org_id = $1`,
    [supplierOrgId]
  );
  return res.rows.map(r => r.id);
};

exports.getAllPOIds = async () => {
  const res = await pool.query(`SELECT id FROM purchase_orders`);
  return res.rows.map(r => r.id);
};

exports.getEventsForPOs = async (poIds) => {

  if (!poIds.length) return [];

  const res = await pool.query(`
    SELECT
      po_id,
      event_type,
      metadata,
      event_timestamp AS created_at
    FROM po_events
    WHERE po_id = ANY($1)
  `, [poIds]);

  return res.rows;
};