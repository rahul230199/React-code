const pool = require("../src/config/db");


/**
 * Submit Supplier Quote
 */
const createQuote = async (data) => {
  const {
    rfq_id,
    supplier_id,
    price,
    batch_quantity,
    delivery_timeline,
    material_specification,
    certifications,
  } = data;

  const query = `
    INSERT INTO quotes (
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
    RETURNING *;
  `;

  const values = [
    rfq_id,
    supplier_id,
    price,
    batch_quantity,
    delivery_timeline,
    material_specification,
    certifications,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get Quotes for RFQ (Buyer View)
 */
const getQuotesByRFQ = async (rfq_id) => {
  const query = `
    SELECT *
    FROM quotes
    WHERE rfq_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [rfq_id]);
  return result.rows;
};

/**
 * Get Quote by ID
 */
const getQuoteById = async (quote_id) => {
  const query = `
    SELECT *
    FROM quotes
    WHERE id = $1;
  `;

  const result = await pool.query(query, [quote_id]);
  return result.rows[0];
};

module.exports = {
  createQuote,
  getQuotesByRFQ,
  getQuoteById,
};
