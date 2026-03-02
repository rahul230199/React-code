/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD SERVICE
   Redis Cached
   AI Risk Engine Integrated
   Fully Tenant Safe
========================================================= */

const cache = require("../../../utils/cacheManager");
const queries = require("./buyer.dashboard.queries");
const { calculateOrgRisk } = require("../../risk/risk.engine");

/* =========================================================
   SAFE NUMBER CAST
========================================================= */

const toNumber = (val) => Number(val || 0);

/* =========================================================
   DASHBOARD SUMMARY (REDIS CACHED + AI RISK)
========================================================= */

exports.getDashboardSummary = async (orgId) => {

  /* -------------------------------------------------------
     1️⃣ CACHE CHECK FIRST
  ------------------------------------------------------- */

  try {
    const cached = await cache.get("dashboard_summary", orgId);
    if (cached) return cached;
  } catch (err) {
    console.warn("Redis read failed, continuing without cache");
  }

  /* -------------------------------------------------------
     2️⃣ FETCH CORE DATA
  ------------------------------------------------------- */

  const [
    financialRes,
    orderMetricsRes,
    rfqMetricsRes,
    pendingPaymentsRes,
    disputesRes,
    reliabilityRes,
    aiRisk
  ] = await Promise.all([
    queries.getFinancialSummary(orgId),
    queries.getOrderMetrics(orgId),
    queries.getRFQMetrics(orgId),
    queries.getPendingPayments(orgId),
    queries.getOpenDisputes(orgId),
    queries.getReliabilitySnapshot(orgId),
    calculateOrgRisk(orgId) // 🚀 AI ENGINE
  ]);

  const financial = financialRes.rows[0] || {};
  const orders = orderMetricsRes.rows[0] || {};
  const rfqs = rfqMetricsRes.rows[0] || {};
  const payments = pendingPaymentsRes.rows[0] || {};
  const disputes = disputesRes.rows[0] || {};
  const reliability = reliabilityRes.rows[0] || {};

  /* -------------------------------------------------------
     3️⃣ BUILD PAYLOAD
  ------------------------------------------------------- */

  const payload = {

    financial: {
      total_committed: toNumber(financial.total_committed),
      total_paid: toNumber(financial.total_paid),
      outstanding_balance: toNumber(financial.outstanding_balance)
    },

    kpis: {
      active_rfqs: toNumber(rfqs.active_rfqs),
      quotes_pending: toNumber(rfqs.quotes_pending),
      active_orders: toNumber(orders.active_orders),
      delayed_orders: toNumber(orders.delayed_orders),
      payments_pending: toNumber(payments.payments_pending)
    },

    disputes: {
      open: toNumber(disputes.open_disputes)
    },

    supplier_reliability: {
      average_score: toNumber(reliability.avg_reliability),
      low_reliability_suppliers:
        toNumber(reliability.low_reliability_suppliers)
    },

    system_health: {
      risk_level: aiRisk.risk_level,
      risk_score: aiRisk.risk_score,
      metrics: aiRisk.metrics
    }

  };

  /* -------------------------------------------------------
     4️⃣ STORE IN CACHE
  ------------------------------------------------------- */

  try {
    await cache.set("dashboard_summary", orgId, payload, 60);
  } catch (err) {
    console.warn("Redis write failed");
  }

  return payload;
};

/* =========================================================
   SPEND TREND
========================================================= */
exports.getSpendTrend = async (orgId) => {
  const result = await queries.getSpendTrend(orgId);
  return result.rows || [];
};

/* =========================================================
   SUPPLIER BREAKDOWN
========================================================= */
exports.getSupplierBreakdown = async (orgId) => {
  const result = await queries.getSupplierBreakdown(orgId);
  return result.rows || [];
};