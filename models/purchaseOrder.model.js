const pool = require("../src/config/db");

/* =========================================================
   GET POs BY BUYER (Dashboard Optimized)
========================================================= */
const getPOsByBuyer = async (buyer_id) => {

  const query = `
    SELECT 
      po.id,
      po.rfq_id,
      po.quote_id,
      po.quantity,
      po.price,
      po.status,
      po.created_at,

      r.part_name,
      r.total_quantity,
      r.delivery_timeline,

      q.price AS quoted_price,

      u.username AS supplier_name,
      u.email AS supplier_email

    FROM purchase_orders po

    INNER JOIN rfqs r
      ON r.id = po.rfq_id

    INNER JOIN quotes q
      ON q.id = po.quote_id

    INNER JOIN users u
      ON u.id = po.supplier_id

    WHERE po.buyer_id = $1

    ORDER BY po.created_at DESC;
  `;

  const result = await pool.query(query, [buyer_id]);
  return result.rows;
};


/* =========================================================
   GET POs BY SUPPLIER (Dashboard Optimized)
========================================================= */
const getPOsBySupplier = async (supplier_id) => {

  const query = `
    SELECT 
      po.id,
      po.rfq_id,
      po.quote_id,
      po.quantity,
      po.price,
      po.status,
      po.created_at,

      r.part_name,
      r.total_quantity,
      r.delivery_timeline,

      q.price AS quoted_price,

      u.username AS buyer_name,
      u.email AS buyer_email

    FROM purchase_orders po

    INNER JOIN rfqs r
      ON r.id = po.rfq_id

    INNER JOIN quotes q
      ON q.id = po.quote_id

    INNER JOIN users u
      ON u.id = po.buyer_id

    WHERE po.supplier_id = $1

    ORDER BY po.created_at DESC;
  `;

  const result = await pool.query(query, [supplier_id]);
  return result.rows;
};


/* =========================================================
   GET PO BY ID (Detailed View)
========================================================= */
const getPOById = async (po_id) => {

  const query = `
    SELECT 
      po.*,

      r.part_name,
      r.part_id,
      r.total_quantity,
      r.batch_quantity,
      r.delivery_timeline,
      r.material_specification,
      r.ppap_level,

      q.price AS quoted_price,
      q.batch_quantity AS quoted_batch_quantity,
      q.delivery_timeline AS quoted_delivery_timeline,

      buyer.username AS buyer_name,
      buyer.email AS buyer_email,

      supplier.username AS supplier_name,
      supplier.email AS supplier_email

    FROM purchase_orders po

    INNER JOIN rfqs r
      ON r.id = po.rfq_id

    INNER JOIN quotes q
      ON q.id = po.quote_id

    INNER JOIN users buyer
      ON buyer.id = po.buyer_id

    INNER JOIN users supplier
      ON supplier.id = po.supplier_id

    WHERE po.id = $1;
  `;

  const result = await pool.query(query, [po_id]);
  return result.rows[0] || null;
};


module.exports = {
  getPOsByBuyer,
  getPOsBySupplier,
  getPOById
};