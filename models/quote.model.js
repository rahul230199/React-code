const pool = require("../src/config/db");

/* =========================================================
   CREATE OR UPDATE SUPPLIER QUOTE
   (Supplier can submit only once per RFQ)
========================================================= */
const createOrUpdateQuote = async (data) => {
  const {
    rfq_id,
    supplier_id,
    price,
    batch_quantity,
    delivery_timeline,
    material_specification,
    certifications,
  } = data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 Check RFQ is active
    const rfqCheck = await client.query(
      `SELECT status FROM rfqs WHERE id = $1`,
      [rfq_id]
    );

    if (!rfqCheck.rows.length) {
      throw new Error("RFQ not found");
    }

    if (rfqCheck.rows[0].status !== "active") {
      throw new Error("Cannot quote on inactive RFQ");
    }

    // 🔒 Check if supplier already has quote
    const existing = await client.query(
      `SELECT id, status FROM quotes
       WHERE rfq_id = $1 AND supplier_id = $2
       FOR UPDATE`,
      [rfq_id, supplier_id]
    );

    let result;

    if (existing.rows.length) {
      const existingQuote = existing.rows[0];

      // 🔒 Prevent edit if already accepted
      if (existingQuote.status === "accepted") {
        throw new Error("Cannot modify accepted quote");
      }

      // 🔁 Update existing quote
      result = await client.query(
        `UPDATE quotes
         SET price = $1,
             batch_quantity = $2,
             delivery_timeline = $3,
             material_specification = $4,
             certifications = $5,
             status = 'submitted',
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          price,
          batch_quantity,
          delivery_timeline,
          material_specification,
          certifications,
          existingQuote.id
        ]
      );

    } else {

      // ➕ Insert new quote
      result = await client.query(
        `INSERT INTO quotes (
          rfq_id,
          supplier_id,
          price,
          batch_quantity,
          delivery_timeline,
          material_specification,
          certifications,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,'submitted')
        RETURNING *`,
        [
          rfq_id,
          supplier_id,
          price,
          batch_quantity,
          delivery_timeline,
          material_specification,
          certifications
        ]
      );
    }

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/* =========================================================
   GET QUOTES FOR RFQ (Buyer View)
========================================================= */
const getQuotesByRFQ = async (rfq_id) => {
  const query = `
    SELECT 
      q.*,
      u.email AS supplier_email,
      u.username AS supplier_name,
      po.id AS purchase_order_id

    FROM quotes q
    JOIN users u
      ON u.id = q.supplier_id

    LEFT JOIN purchase_orders po
      ON po.quote_id = q.id

    WHERE q.rfq_id = $1
    ORDER BY q.created_at DESC;
  `;

  const result = await pool.query(query, [rfq_id]);
  return result.rows;
};

/* =========================================================
   GET QUOTE BY ID (Detailed View)
========================================================= */
const getQuoteById = async (quote_id) => {
  const query = `
    SELECT 
      q.*,
      r.part_name,
      r.total_quantity,
      r.status AS rfq_status,
      u.email AS supplier_email,
      u.username AS supplier_name,
      po.id AS purchase_order_id,
      po.status AS po_status

    FROM quotes q
    JOIN rfqs r
      ON r.id = q.rfq_id
    JOIN users u
      ON u.id = q.supplier_id
    LEFT JOIN purchase_orders po
      ON po.quote_id = q.id

    WHERE q.id = $1;
  `;

  const result = await pool.query(query, [quote_id]);
  return result.rows[0];
};

/* =========================================================
   CHECK SUPPLIER ACCESS TO RFQ
========================================================= */
const checkSupplierAccess = async (rfq_id, supplier_id) => {
  const result = await pool.query(
    `SELECT id FROM rfq_suppliers
     WHERE rfq_id = $1
       AND supplier_id = $2`,
    [rfq_id, supplier_id]
  );

  return result.rows.length > 0;
};

module.exports = {
  createOrUpdateQuote,
  getQuotesByRFQ,
  getQuoteById,
  checkSupplierAccess
};