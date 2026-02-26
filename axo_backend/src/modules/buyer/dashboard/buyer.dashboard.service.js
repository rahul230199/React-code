const queries = require("./buyer.dashboard.queries");

exports.getDashboardSummary = async (orgId) => {

  const [
    committed,
    actual,
    orders,
    rfqs,
    disputes,
    reliability
  ] = await Promise.all([
    queries.getCommittedSpend(orgId),
    queries.getActualSpend(orgId),
    queries.getOrderCounts(orgId),
    queries.getRFQCount(orgId),
    queries.getDisputeCount(orgId),
    queries.getAverageReliability(orgId)
  ]);

  return {
    committed_spend: committed.rows[0],
    actual_spend: actual.rows[0],
    orders: orders.rows[0],
    rfqs: rfqs.rows[0],
    disputes: disputes.rows[0],
    supplier_reliability: {
      average_score: reliability.rows[0].avg_score || 0
    }
  };
};

exports.getSpendTrend = async (orgId) => {

  const [committed, actual] = await Promise.all([
    queries.getSpendTrend(orgId),
    queries.getPaymentTrend(orgId)
  ]);

  return {
    committed: committed.rows,
    actual: actual.rows
  };
};

exports.getSupplierBreakdown = async (orgId) => {
  const result = await queries.getSupplierBreakdown(orgId);
  return result.rows;
};

exports.getOrderDistribution = async (orgId) => {
  const result = await queries.getOrderStatusDistribution(orgId);
  return result.rows;
};