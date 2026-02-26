/* =========================================================
   AXO NETWORKS — RISK ENGINE
   Purpose:
   - Detect operational risks across purchase orders
   - Power dashboard heatmap
   - Enable proactive enterprise monitoring
   - Production safe
========================================================= */

const pool = require("../../config/db");

/* =========================================================
   GET OVERDUE MILESTONES
   - Milestones pending past expected deadline
========================================================= */
async function getOverdueMilestones(client = pool) {

  const result = await client.query(
    `
    SELECT
      pm.po_id,
      pm.milestone_name,
      pm.updated_at,
      po.supplier_org_id
    FROM po_milestones pm
    JOIN purchase_orders po ON pm.po_id = po.id
    WHERE pm.status != 'completed'
      AND po.promised_delivery_date IS NOT NULL
      AND NOW() > po.promised_delivery_date
    `
  );

  return result.rows;
}

/* =========================================================
   GET DELAYED DELIVERIES
   - Completed but delivered after promise
========================================================= */
async function getDelayedDeliveries(client = pool) {

  const result = await client.query(
    `
    SELECT id, supplier_org_id
    FROM purchase_orders
    WHERE status = 'completed'
      AND actual_delivery_date IS NOT NULL
      AND promised_delivery_date IS NOT NULL
      AND actual_delivery_date > promised_delivery_date
    `
  );

  return result.rows;
}

/* =========================================================
   GET ACTIVE DISPUTES
========================================================= */
async function getActiveDisputes(client = pool) {

  const result = await client.query(
    `
    SELECT po_id, organization_id
    FROM po_disputes
    WHERE resolved_at IS NULL
    `
  );

  return result.rows;
}

/* =========================================================
   GET LOW RELIABILITY SUPPLIERS
   - Uses stored reliability_scores
========================================================= */
async function getLowReliabilitySuppliers(threshold = 60, client = pool) {

  const result = await client.query(
    `
    SELECT organization_id, score
    FROM reliability_scores
    WHERE score < $1
    `,
    [threshold]
  );

  return result.rows;
}

/* =========================================================
   AGGREGATED RISK SUMMARY
   - Used for dashboard
========================================================= */
async function getRiskSummary(client = pool) {

  const [
    overdue,
    delayed,
    disputes,
    lowReliability
  ] = await Promise.all([
    getOverdueMilestones(client),
    getDelayedDeliveries(client),
    getActiveDisputes(client),
    getLowReliabilitySuppliers(60, client)
  ]);

  return {
    overdue_milestones: overdue.length,
    delayed_deliveries: delayed.length,
    active_disputes: disputes.length,
    low_reliability_suppliers: lowReliability.length
  };
}

module.exports = {
  getOverdueMilestones,
  getDelayedDeliveries,
  getActiveDisputes,
  getLowReliabilitySuppliers,
  getRiskSummary
};