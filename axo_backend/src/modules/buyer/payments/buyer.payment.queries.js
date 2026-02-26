const pool = require("../../../config/db");

const getPoValue = async (orgId, poId) => {
  return pool.query(
    `
    SELECT id, value
    FROM purchase_orders
    WHERE id = $1
    AND buyer_org_id = $2
    `,
    [poId, orgId]
  );
};

const getPaymentsForPo = async (poId) => {
  return pool.query(
    `
    SELECT id AS payment_id,
           amount,
           status,
           paid_at
    FROM payments
    WHERE po_id = $1
    ORDER BY paid_at ASC
    `,
    [poId]
  );
};

module.exports = {
  getPoValue,
  getPaymentsForPo
};