const pool = require("../../../config/db");

const getQuotesForRFQ = async (orgId, rfqId) => {
  return pool.query(
    `
    SELECT
      q.id AS quote_id,
      q.supplier_org_id,
      q.total_price,
      q.delivery_days,
      rs.final_score AS reliability_score
    FROM quotes q
    JOIN rfqs r ON r.id = q.rfq_id
    LEFT JOIN reliability_scores rs
      ON rs.organization_id = q.supplier_org_id
    WHERE r.id = $1
    AND r.buyer_id = $2
    `,
    [rfqId, orgId]
  );
};

module.exports = { getQuotesForRFQ };