/* =========================================================
   AXO NETWORKS — BUYER ORDERS QUERIES
   Intelligence Ready | Transaction Safe | Enterprise Clean
========================================================= */

const pool = require("../../../config/db");

/* =========================================================
   FETCH BUYER ORDERS (Lightweight List View)
========================================================= */
exports.getBuyerOrders = async (buyerOrgId) => {

  const res = await pool.query(
    `
    SELECT
      id,
      supplier_org_id,
      status,
      total_amount,
      promised_delivery_date,
      created_at
    FROM purchase_orders
    WHERE buyer_org_id = $1
    ORDER BY created_at DESC
    `,
    [buyerOrgId]
  );

  return res.rows;
};

/* =========================================================
   FETCH SINGLE PO
========================================================= */
exports.getPOById = async (poId, client = pool) => {

  const res = await client.query(
    `
    SELECT *
    FROM purchase_orders
    WHERE id = $1
    `,
    [poId]
  );

  return res.rows[0];
};

/* =========================================================
   FETCH PO EVENTS (Behavioral Ledger)
========================================================= */
exports.getEvents = async (poId, client = pool) => {

  const res = await client.query(
    `
    SELECT
      event_type,
      actor_id,
      metadata,
      created_at
    FROM po_events
    WHERE entity_type = 'PO'
      AND entity_id = $1
    ORDER BY created_at ASC
    `,
    [poId]
  );

  return res.rows;
};

/* =========================================================
   UPDATE PO STATUS
========================================================= */
exports.updatePOStatus = async (poId, newStatus, client) => {

  await client.query(
    `
    UPDATE purchase_orders
    SET status = $1
    WHERE id = $2
    `,
    [newStatus, poId]
  );
};

/* =========================================================
   INSERT DISPUTE (Returns ID)
========================================================= */
exports.insertDispute = async (poId, reason, userId, client) => {

  const res = await client.query(
    `
    INSERT INTO po_disputes (po_id, reason, raised_by, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id
    `,
    [poId, reason, userId]
  );

  return res.rows[0].id;
};

/* =========================================================
   INSERT PAYMENT
========================================================= */
exports.insertPayment = async (poId, amount, userId, client) => {

  await client.query(
    `
    INSERT INTO payments (po_id, amount, paid_by, created_at)
    VALUES ($1, $2, $3, NOW())
    `,
    [poId, amount, userId]
  );
};

/* =========================================================
   FETCH BUYER PO IDS (Used for Risk & Anomaly)
========================================================= */
exports.getBuyerPOIds = async (buyerOrgId, client = pool) => {

  const res = await client.query(
    `
    SELECT id
    FROM purchase_orders
    WHERE buyer_org_id = $1
    `,
    [buyerOrgId]
  );

  return res.rows.map(row => row.id);
};

/* =========================================================
   FETCH EVENTS FOR MULTIPLE POS
========================================================= */
exports.getEventsForPOs = async (poIds, client = pool) => {

  if (!poIds.length) return [];

  const res = await client.query(
    `
    SELECT entity_id, event_type, metadata, created_at
    FROM po_events
    WHERE entity_id = ANY($1)
    `,
    [poIds]
  );

  return res.rows;
};