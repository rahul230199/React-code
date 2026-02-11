const pool = require("../src/config/db");


/**
 * Send message in RFQ
 */
const sendMessage = async (data) => {
  const { rfq_id, sender_id, message } = data;

  const query = `
    INSERT INTO rfq_messages (
      rfq_id,
      sender_id,
      message
    )
    VALUES ($1,$2,$3)
    RETURNING *;
  `;

  const values = [rfq_id, sender_id, message];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get all messages for RFQ
 */
const getMessagesByRFQ = async (rfq_id) => {
  const query = `
    SELECT *
    FROM rfq_messages
    WHERE rfq_id = $1
    ORDER BY created_at ASC;
  `;

  const result = await pool.query(query, [rfq_id]);
  return result.rows;
};

module.exports = {
  sendMessage,
  getMessagesByRFQ,
};
