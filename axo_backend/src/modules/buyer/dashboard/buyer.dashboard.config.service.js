/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD CONFIG SERVICE
   Enterprise Grade
   Safe Defaults
   Strict Validation
   Fully Dynamic
========================================================= */

const queries = require("./buyer.dashboard.config.queries");
const AppError = require("../../../utils/AppError");

/* =========================================================
   DEFAULT CONFIG (Used Only If DB Missing)
========================================================= */

const DEFAULT_CONFIG = {
  risk_overdue_weight: 5,
  risk_dispute_weight: 10,
  risk_reliability_penalty: 30,
  reliability_threshold: 60,
  high_risk_threshold: 50,
  elevated_risk_threshold: 25,
  default_chart_months: 6
};

/* =========================================================
   SAFE NUMERIC CAST
========================================================= */

const toSafeNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

/* =========================================================
   GET CONFIG
   - Always returns usable config
   - Never returns null
========================================================= */

const getDashboardConfig = async (orgId) => {

  if (!orgId) {
    throw new AppError("Organization ID required.", 400);
  }

  const result = await queries.getDashboardConfig(orgId);

  if (!result.rowCount) {
    return {
      organization_id: orgId,
      ...DEFAULT_CONFIG
    };
  }

  const row = result.rows[0];

  return {
    organization_id: row.organization_id,
    risk_overdue_weight: toSafeNumber(row.risk_overdue_weight, 5),
    risk_dispute_weight: toSafeNumber(row.risk_dispute_weight, 10),
    risk_reliability_penalty: toSafeNumber(row.risk_reliability_penalty, 30),
    reliability_threshold: toSafeNumber(row.reliability_threshold, 60),
    high_risk_threshold: toSafeNumber(row.high_risk_threshold, 50),
    elevated_risk_threshold: toSafeNumber(row.elevated_risk_threshold, 25),
    default_chart_months: toSafeNumber(row.default_chart_months, 6)
  };
};

/* =========================================================
   UPDATE / UPSERT CONFIG
   - Full validation
   - Threshold consistency enforcement
========================================================= */

const upsertDashboardConfig = async (orgId, incomingConfig) => {

  if (!orgId) {
    throw new AppError("Organization ID required.", 400);
  }

  if (!incomingConfig || typeof incomingConfig !== "object") {
    throw new AppError("Invalid configuration payload.", 400);
  }

  const safeConfig = {
    risk_overdue_weight: toSafeNumber(
      incomingConfig.risk_overdue_weight,
      DEFAULT_CONFIG.risk_overdue_weight
    ),
    risk_dispute_weight: toSafeNumber(
      incomingConfig.risk_dispute_weight,
      DEFAULT_CONFIG.risk_dispute_weight
    ),
    risk_reliability_penalty: toSafeNumber(
      incomingConfig.risk_reliability_penalty,
      DEFAULT_CONFIG.risk_reliability_penalty
    ),
    reliability_threshold: toSafeNumber(
      incomingConfig.reliability_threshold,
      DEFAULT_CONFIG.reliability_threshold
    ),
    high_risk_threshold: toSafeNumber(
      incomingConfig.high_risk_threshold,
      DEFAULT_CONFIG.high_risk_threshold
    ),
    elevated_risk_threshold: toSafeNumber(
      incomingConfig.elevated_risk_threshold,
      DEFAULT_CONFIG.elevated_risk_threshold
    ),
    default_chart_months: toSafeNumber(
      incomingConfig.default_chart_months,
      DEFAULT_CONFIG.default_chart_months
    )
  };

  /* -----------------------------
     Guardrails
  ----------------------------- */

  if (safeConfig.elevated_risk_threshold >= safeConfig.high_risk_threshold) {
    throw new AppError(
      "elevated_risk_threshold must be lower than high_risk_threshold.",
      400
    );
  }

  for (const key of Object.keys(safeConfig)) {
    if (safeConfig[key] < 0) {
      throw new AppError(`${key} cannot be negative.`, 400);
    }
  }

  const result = await queries.upsertDashboardConfig(orgId, safeConfig);

  return result.rows[0];
};

module.exports = {
  getDashboardConfig,
  upsertDashboardConfig
};