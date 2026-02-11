const pool = require("../src/config/db");

/**
 * Create Purchase Order (when buyer accepts quote)
 */
const createPurchaseOrder = async (data) => {
  const {
    rfq_id,
    quote_id,
    buyer_id,
    supplier_id,
    quantity,
    price,
  } = data;

  const query = `
    INSERT INTO purchase_orders (
      rfq_id,
      quote_id,
      buyer_id,
      supplier_id,
      quantity,
      price,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,'issued')
    RETURNING *;
  `;

  const values = [
    rfq_id,
    quote_id,
    buyer_id,
    supplier_id,
    quantity,
    price,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get POs by Buyer
 */
const getPOsByBuyer = async (buyer_id) => {
  const query = `
    SELECT *
    FROM purchase_orders
    WHERE buyer_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [buyer_id]);
  return result.rows;
};

/**
 * Get POs by Supplier
 */
const getPOsBySupplier = async (supplier_id) => {
  const query = `
    SELECT *
    FROM purchase_orders
    WHERE supplier_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [supplier_id]);
  return result.rows;
};

/**
 * Get PO by ID
 */
const getPOById = async (po_id) => {
  const query = `
    SELECT *
    FROM purchase_orders
    WHERE id = $1;
  `;

  const result = await pool.query(query, [po_id]);
  return result.rows[0];
};

module.exports = {
  createPurchaseOrder,
  getPOsByBuyer,
  getPOsBySupplier,
  getPOById,
};
