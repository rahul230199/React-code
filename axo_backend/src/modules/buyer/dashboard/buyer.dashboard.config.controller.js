/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD CONFIG CONTROLLER
   Production Ready
   Tenant Isolated
   Fully Validated
========================================================= */

const asyncHandler = require("../../../utils/asyncHandler");
const AppError = require("../../../utils/AppError");
const service = require("./buyer.dashboard.config.service");

/* =========================================================
   SAFE ORG EXTRACTION
========================================================= */

const getOrgId = (req) => {
  if (!req.user || !req.user.organization_id) {
    throw new AppError("Unauthorized tenant access.", 401);
  }
  return req.user.organization_id;
};

/* =========================================================
   VALIDATION GUARDRAILS
========================================================= */

const validateConfigBounds = (config) => {

  const numericFields = [
    "risk_overdue_weight",
    "risk_dispute_weight",
    "risk_reliability_penalty",
    "reliability_threshold",
    "high_risk_threshold",
    "elevated_risk_threshold",
    "default_chart_months"
  ];

  for (const field of numericFields) {
    if (config[field] !== undefined) {
      const value = Number(config[field]);

      if (Number.isNaN(value)) {
        throw new AppError(`${field} must be a valid number.`, 400);
      }

      if (value < 0) {
        throw new AppError(`${field} cannot be negative.`, 400);
      }
    }
  }

  if (
    config.high_risk_threshold !== undefined &&
    config.elevated_risk_threshold !== undefined
  ) {
    if (
      Number(config.elevated_risk_threshold) >=
      Number(config.high_risk_threshold)
    ) {
      throw new AppError(
        "elevated_risk_threshold must be less than high_risk_threshold.",
        400
      );
    }
  }
};

/* =========================================================
   GET DASHBOARD CONFIG
   GET /api/buyer/dashboard/config
========================================================= */

exports.getDashboardConfig = asyncHandler(async (req, res) => {

  const orgId = getOrgId(req);

  const config = await service.getDashboardConfig(orgId);

  res.status(200).json({
    success: true,
    data: config
  });

});

/* =========================================================
   UPDATE DASHBOARD CONFIG
   PUT /api/buyer/dashboard/config
========================================================= */

exports.updateDashboardConfig = asyncHandler(async (req, res) => {

  const orgId = getOrgId(req);

  const incomingConfig = req.body;

  if (!incomingConfig || typeof incomingConfig !== "object") {
    throw new AppError("Invalid configuration payload.", 400);
  }

  validateConfigBounds(incomingConfig);

  const updated = await service.upsertDashboardConfig(
    orgId,
    incomingConfig
  );

  res.status(200).json({
    success: true,
    message: "Dashboard configuration updated successfully.",
    data: updated
  });

});