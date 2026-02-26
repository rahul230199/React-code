const pool = require("../../../config/db");

const getCommittedSpend = async (orgId) => {
  return pool.query(
    `
    SELECT
      SUM(CASE WHEN accepted_at >= NOW() - INTERVAL '30 days' THEN value ELSE 0 END) AS last_30,
      SUM(CASE WHEN accepted_at >= NOW() - INTERVAL '60 days' THEN value ELSE 0 END) AS last_60,
      SUM(CASE WHEN accepted_at >= NOW() - INTERVAL '90 days' THEN value ELSE 0 END) AS last_90
    FROM purchase_orders
    WHERE buyer_org_id = $1
    AND accepted_at IS NOT NULL
    AND status IN ('accepted','in_progress','completed','disputed')
    `,
    [orgId]
  );
};

const getActualSpend = async (orgId) => {
  return pool.query(
    `
    SELECT
      SUM(CASE WHEN paid_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) AS last_30,
      SUM(CASE WHEN paid_at >= NOW() - INTERVAL '60 days' THEN amount ELSE 0 END) AS last_60,
      SUM(CASE WHEN paid_at >= NOW() - INTERVAL '90 days' THEN amount ELSE 0 END) AS last_90
    FROM payments
    WHERE organization_id = $1
    AND status = 'paid'
    `,
    [orgId]
  );
};

const getOrderCounts = async (orgId) => {
  return pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status IN ('issued','accepted','in_progress')) AS active,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status = 'disputed') AS disputed
    FROM purchase_orders
    WHERE buyer_org_id = $1
    `,
    [orgId]
  );
};

const getRFQCount = async (orgId) => {
  return pool.query(
    `
    SELECT COUNT(*) AS open
    FROM rfqs
    WHERE buyer_id = $1
    AND status = 'open'
    `,
    [orgId]
  );
};

const getDisputeCount = async (orgId) => {
  return pool.query(
    `
    SELECT COUNT(*) AS open
    FROM podisputes
    WHERE buyer_id = $1
    AND status = 'open'
    `,
    [orgId]
  );
};

const getAverageReliability = async (orgId) => {
  return pool.query(
    `
    SELECT AVG(rs.final_score) AS avg_score
    FROM purchase_orders po
    JOIN reliability_scores rs
      ON po.supplier_org_id = rs.organization_id
    WHERE po.buyer_org_id = $1
    `,
    [orgId]
  );
};

const getSpendTrend = async (orgId) => {
  return pool.query(
    `
    SELECT
      DATE_TRUNC('month', accepted_at) AS month,
      SUM(value) AS committed_spend
    FROM purchase_orders
    WHERE buyer_org_id = $1
    AND accepted_at IS NOT NULL
    GROUP BY month
    ORDER BY month ASC
    `,
    [orgId]
  );
};

const getPaymentTrend = async (orgId) => {
  return pool.query(
    `
    SELECT
      DATE_TRUNC('month', paid_at) AS month,
      SUM(amount) AS actual_spend
    FROM payments
    WHERE organization_id = $1
    AND status = 'paid'
    GROUP BY month
    ORDER BY month ASC
    `,
    [orgId]
  );
};

const getSupplierBreakdown = async (orgId) => {
  return pool.query(
    `
    SELECT
      o.name,
      COUNT(po.id) AS total_orders,
      SUM(po.value) AS total_value,
      AVG(rs.final_score) AS avg_reliability
    FROM purchase_orders po
    JOIN organizations o
      ON po.supplier_org_id = o.id
    LEFT JOIN reliability_scores rs
      ON rs.organization_id = o.id
    WHERE po.buyer_org_id = $1
    GROUP BY o.name
    ORDER BY total_value DESC
    `,
    [orgId]
  );
};

const getOrderStatusDistribution = async (orgId) => {
  return pool.query(
    `
    SELECT
      status,
      COUNT(*) AS count
    FROM purchase_orders
    WHERE buyer_org_id = $1
    GROUP BY status
    `,
    [orgId]
  );
};



module.exports = {
  getCommittedSpend,
  getActualSpend,
  getOrderCounts,
  getRFQCount,
  getDisputeCount,
  getAverageReliability,
  getSpendTrend,
  getPaymentTrend,
  getSupplierBreakdown,
  getOrderStatusDistribution
};

