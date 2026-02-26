const pool = require("../../../config/db");

const getOrderTimeline = async (orgId, poId) => {
  return pool.query(
    `
    SELECT
      event_type,
      actor_id,
      metadata,
      created_at
    FROM po_events
    WHERE entity_type = 'PO'
    AND entity_id = $1
    AND EXISTS (
        SELECT 1 FROM purchase_orders
        WHERE id = $1
        AND buyer_org_id = $2
    )
    ORDER BY created_at ASC
    `,
    [poId, orgId]
  );
};

module.exports = {
  getOrderTimeline
};