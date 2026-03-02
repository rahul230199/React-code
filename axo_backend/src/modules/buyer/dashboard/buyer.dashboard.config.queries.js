/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD CONFIG QUERIES
   Fully Dynamic
   Strict Tenant Scoped
   Production Hardened
========================================================= */

const pool = require("../../../config/db");

/* =========================================================
   GET DASHBOARD CONFIG
   - Explicit column selection (no SELECT *)
   - Deterministic return structure
========================================================= */

const getDashboardConfig = async (orgId) => {
  return pool.query(
    `
    SELECT
      organization_id,
      risk_overdue_weight,
      risk_dispute_weight,
      risk_reliability_penalty,
      reliability_threshold,
      high_risk_threshold,
      elevated_risk_threshold,
      default_chart_months,
      created_at,
      updated_at
    FROM buyer_dashboard_configs
    WHERE organization_id = $1
    `,
    [orgId]
  );
};

/* =========================================================
   UPSERT DASHBOARD CONFIG
   - Safe conflict handling
   - No partial silent failure
   - Fully dynamic input
========================================================= */

const upsertDashboardConfig = async (orgId, config) => {
  return pool.query(
    `
    INSERT INTO buyer_dashboard_configs (
      organization_id,
      risk_overdue_weight,
      risk_dispute_weight,
      risk_reliability_penalty,
      reliability_threshold,
      high_risk_threshold,
      elevated_risk_threshold,
      default_chart_months,
      updated_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,NOW()
    )
    ON CONFLICT (organization_id)
    DO UPDATE SET
      risk_overdue_weight = EXCLUDED.risk_overdue_weight,
      risk_dispute_weight = EXCLUDED.risk_dispute_weight,
      risk_reliability_penalty = EXCLUDED.risk_reliability_penalty,
      reliability_threshold = EXCLUDED.reliability_threshold,
      high_risk_threshold = EXCLUDED.high_risk_threshold,
      elevated_risk_threshold = EXCLUDED.elevated_risk_threshold,
      default_chart_months = EXCLUDED.default_chart_months,
      updated_at = NOW()
    RETURNING
      organization_id,
      risk_overdue_weight,
      risk_dispute_weight,
      risk_reliability_penalty,
      reliability_threshold,
      high_risk_threshold,
      elevated_risk_threshold,
      default_chart_months,
      created_at,
      updated_at
    `,
    [
      orgId,
      config.risk_overdue_weight,
      config.risk_dispute_weight,
      config.risk_reliability_penalty,
      config.reliability_threshold,
      config.high_risk_threshold,
      config.elevated_risk_threshold,
      config.default_chart_months
    ]
  );
};

module.exports = {
  getDashboardConfig,
  upsertDashboardConfig
};