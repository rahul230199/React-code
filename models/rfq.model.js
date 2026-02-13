const pool = require("../src/config/db");

/* =========================================================
   CREATE RFQ (DRAFT)
========================================================= */
const createRFQ = async (data) => {

  const {
    buyer_id,
    part_name,
    part_id,
    total_quantity,
    batch_quantity,
    target_price,
    delivery_timeline,
    material_specification,
    ppap_level
  } = data;

  const result = await pool.query(
    `INSERT INTO rfqs (
      buyer_id,
      part_name,
      part_id,
      total_quantity,
      batch_quantity,
      target_price,
      delivery_timeline,
      material_specification,
      ppap_level,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft')
    RETURNING *`,
    [
      buyer_id,
      part_name,
      part_id,
      total_quantity,
      batch_quantity,
      target_price,
      delivery_timeline,
      material_specification,
      ppap_level
    ]
  );

  return result.rows[0];
};

/* =========================================================
   GET RFQS BY BUYER
========================================================= */
const getRFQsByBuyer = async (buyer_id) => {

  const result = await pool.query(
    `SELECT *
     FROM rfqs
     WHERE buyer_id = $1
     ORDER BY created_at DESC`,
    [buyer_id]
  );

  return result.rows;
};

/* =========================================================
   ASSIGN SUPPLIERS TO RFQ
========================================================= */
const assignSuppliers = async (rfqId, supplierIds) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Remove old assignments
    await client.query(
      `DELETE FROM rfq_suppliers WHERE rfq_id = $1`,
      [rfqId]
    );

    // Insert new assignments
    for (const supplierId of supplierIds) {
      await client.query(
        `INSERT INTO rfq_suppliers (
          rfq_id,
          supplier_id,
          status
        )
        VALUES ($1,$2,'invited')`,
        [rfqId, supplierId]
      );
    }

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================
   COUNT ASSIGNED SUPPLIERS
========================================================= */
const countAssignedSuppliers = async (rfqId) => {

  const result = await pool.query(
    `SELECT COUNT(*) FROM rfq_suppliers WHERE rfq_id = $1`,
    [rfqId]
  );

  return parseInt(result.rows[0].count);
};

/* =========================================================
   UPDATE RFQ STATUS
========================================================= */
const updateStatus = async (rfqId, status) => {

  await pool.query(
    `UPDATE rfqs
     SET status = $1
     WHERE id = $2`,
    [status, rfqId]
  );
};

/* =========================================================
   AWARD RFQ
========================================================= */
const awardRFQ = async (rfqId, supplierId) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Mark RFQ as awarded
    await client.query(
      `UPDATE rfqs
       SET status = 'awarded'
       WHERE id = $1`,
      [rfqId]
    );

    // Mark supplier as selected
    await client.query(
      `UPDATE rfq_suppliers
       SET status = 'awarded'
       WHERE rfq_id = $1 AND supplier_id = $2`,
      [rfqId, supplierId]
    );

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================
   CHECK SUPPLIER ACCESS
========================================================= */
const checkSupplierAccess = async (rfqId, supplierId) => {

  const result = await pool.query(
    `SELECT id
     FROM rfq_suppliers
     WHERE rfq_id = $1
       AND supplier_id = $2`,
    [rfqId, supplierId]
  );

  return result.rows.length > 0;
};

/* =========================================================
   GET RFQS FOR SUPPLIER
========================================================= */
const getRFQsForSupplier = async (supplierId) => {

  const result = await pool.query(
    `SELECT r.*
     FROM rfqs r
     JOIN rfq_suppliers rs
       ON r.id = rs.rfq_id
     WHERE rs.supplier_id = $1
       AND r.status = 'active'
     ORDER BY r.created_at DESC`,
    [supplierId]
  );

  return result.rows;
};

/* =========================================================
   GET RFQ BY ID
========================================================= */
const getRFQById = async (rfqId) => {

  const result = await pool.query(
    `SELECT * FROM rfqs WHERE id = $1`,
    [rfqId]
  );

  if (!result.rows.length) return null;

  return result.rows[0];
};

module.exports = {
  createRFQ,
  getRFQsByBuyer,
  assignSuppliers,
  countAssignedSuppliers,
  updateStatus,
  awardRFQ,
  checkSupplierAccess,
  getRFQsForSupplier,
  getRFQById
};