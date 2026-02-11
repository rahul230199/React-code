const pool = require("../src/config/db");


/**
 * Accept supplier quote and create PO (TRANSACTION)
 */
const acceptQuoteAndCreatePO = async ({
  rfq_id,
  quote_id,
  buyer_id,
  supplier_id,
  quantity,
  price,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* 1️⃣ Accept selected quote */
    await client.query(
      `
      UPDATE quotes
      SET status = 'accepted'
      WHERE id = $1
      `,
      [quote_id]
    );

    /* 2️⃣ Reject other quotes for RFQ */
    await client.query(
      `
      UPDATE quotes
      SET status = 'rejected'
      WHERE rfq_id = $1 AND id != $2
      `,
      [rfq_id, quote_id]
    );

    /* 3️⃣ Close RFQ */
    await client.query(
      `
      UPDATE rfqs
      SET status = 'closed'
      WHERE id = $1
      `,
      [rfq_id]
    );

    /* 4️⃣ Create Purchase Order */
    const poResult = await client.query(
      `
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
      RETURNING *
      `,
      [rfq_id, quote_id, buyer_id, supplier_id, quantity, price]
    );

    await client.query("COMMIT");

    return poResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  acceptQuoteAndCreatePO,
};
