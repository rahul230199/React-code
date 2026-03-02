/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD QUERIES (ENTERPRISE FINAL FIXED)
   Schema Aligned
   Strict Tenant Isolation
   Aggregation Safe
========================================================= */

const pool = require("../../../config/db");

/* =========================================================
   FINANCIAL SUMMARY
   - Prevents double counting
   - Only counts PAID payments
========================================================= */

const getFinancialSummary = async (orgId) => {
  return pool.query(
    `
    WITH payment_totals AS (
      SELECT
        po_id,
        SUM(amount) FILTER (WHERE status = 'paid') AS total_paid
      FROM payments
      GROUP BY po_id
    )
    SELECT
      COALESCE(SUM(po.value),0) AS total_committed,
      COALESCE(SUM(pt.total_paid),0) AS total_paid,
      COALESCE(SUM(po.value) - SUM(COALESCE(pt.total_paid,0)),0) AS outstanding_balance
    FROM purchase_orders po
    LEFT JOIN payment_totals pt
      ON pt.po_id = po.id
    WHERE po.buyer_org_id = $1
    `,
    [orgId]
  );
};

/* =========================================================
   ORDER METRICS
========================================================= */

const getOrderMetrics = async (orgId) => {
  return pool.query(
    `
    SELECT
      COUNT(*) AS total_orders,

      COUNT(*) FILTER (
        WHERE status IN ('issued','accepted','in_progress')
      ) AS active_orders,

      COUNT(*) FILTER (
        WHERE status = 'completed'
      ) AS completed_orders,

      COUNT(*) FILTER (
        WHERE promised_delivery_date IS NOT NULL
        AND promised_delivery_date < CURRENT_DATE
        AND status NOT IN ('completed','cancelled')
      ) AS delayed_orders

    FROM purchase_orders
    WHERE buyer_org_id = $1
    `,
    [orgId]
  );
};

/* =========================================================
   RFQ METRICS
========================================================= */

const getRFQMetrics = async (orgId) => {
  return pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE r.status = 'open') AS active_rfqs,
      COUNT(q.id) FILTER (WHERE r.status = 'open') AS quotes_pending
    FROM rfqs r
    LEFT JOIN quotes q
      ON q.rfq_id = r.id
    WHERE r.buyer_org_id = $1
    `,
    [orgId]
  );
};

/* =========================================================
   PAYMENTS PENDING
========================================================= */

const getPendingPayments = async (orgId) => {
  return pool.query(
    `
    SELECT COUNT(*) AS payments_pending
    FROM payments p
    JOIN purchase_orders po
      ON p.po_id = po.id
    WHERE po.buyer_org_id = $1
      AND p.status = 'initiated'
    `,
    [orgId]
  );
};

/* =========================================================
   OPEN DISPUTES
========================================================= */

const getOpenDisputes = async (orgId) => {
  return pool.query(
    `
    SELECT COUNT(*) AS open_disputes
    FROM po_disputes d
    JOIN purchase_orders po
      ON d.po_id = po.id
    WHERE po.buyer_org_id = $1
      AND d.status = 'open'
    `,
    [orgId]
  );
};

/* =========================================================
   RELIABILITY SNAPSHOT (Schema Correct)
   Uses reliability_scores.final_score
========================================================= */

const getReliabilitySnapshot = async (orgId) => {
  return pool.query(
    `
    SELECT
      COALESCE(AVG(rs.final_score),0) AS avg_reliability,

      COUNT(DISTINCT po.supplier_org_id)
        FILTER (WHERE rs.final_score < 60)
        AS low_reliability_suppliers

    FROM purchase_orders po

    LEFT JOIN reliability_scores rs
      ON rs.organization_id = po.supplier_org_id

    WHERE po.buyer_org_id = $1
    `,
    [orgId]
  );
};

/* =========================================================
   MONTHLY COMMITTED SPEND
========================================================= */

const getSpendTrend = async (orgId) => {
  return pool.query(
    `
    SELECT
      DATE_TRUNC('month', accepted_at) AS month,
      COALESCE(SUM(value),0) AS committed_spend
    FROM purchase_orders
    WHERE buyer_org_id = $1
      AND accepted_at IS NOT NULL
    GROUP BY month
    ORDER BY month ASC
    `,
    [orgId]
  );
};

/* =========================================================
   MONTHLY ACTUAL SPEND
========================================================= */

const getPaymentTrend = async (orgId) => {
  return pool.query(
    `
    SELECT
      DATE_TRUNC('month', paid_at) AS month,
      COALESCE(SUM(amount),0) AS actual_spend
    FROM payments p
    JOIN purchase_orders po
      ON p.po_id = po.id
    WHERE po.buyer_org_id = $1
      AND p.status = 'paid'
    GROUP BY month
    ORDER BY month ASC
    `,
    [orgId]
  );
};

/* =========================================================
   SUPPLIER BREAKDOWN (FIXED: company_name + final_score)
========================================================= */

const getSupplierBreakdown = async (orgId) => {
  return pool.query(
    `
    SELECT
      o.id,
      o.company_name AS name,
      COUNT(po.id) AS total_orders,
      COALESCE(SUM(po.value),0) AS total_value,
      COALESCE(MAX(rs.final_score),0) AS reliability_score

    FROM purchase_orders po

    JOIN organizations o
      ON po.supplier_org_id = o.id
      AND o.type = 'supplier'

    LEFT JOIN reliability_scores rs
      ON rs.organization_id = o.id

    WHERE po.buyer_org_id = $1

    GROUP BY o.id, o.company_name
    ORDER BY total_value DESC
    `,
    [orgId]
  );
};

module.exports = {
  getFinancialSummary,
  getOrderMetrics,
  getRFQMetrics,
  getPendingPayments,
  getOpenDisputes,
  getReliabilitySnapshot,
  getSpendTrend,
  getPaymentTrend,
  getSupplierBreakdown
};