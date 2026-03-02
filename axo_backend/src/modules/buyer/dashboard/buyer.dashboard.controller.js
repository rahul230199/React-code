/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD CONTROLLER (ENTERPRISE FINAL)
   Zero Static Data
   Strict Tenant Isolation
   Safe Audit Logging
   Deterministic Response Contract
========================================================= */

const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.dashboard.service");
const { logEvent } = require("../../../utils/eventLogger");
const AppError = require("../../../utils/AppError");

/* =========================================================
   SAFE TENANT EXTRACTION
========================================================= */

const getOrgId = (req) => {
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }

  const orgId = Number(req.user.organization_id);

  if (!orgId || Number.isNaN(orgId)) {
    throw new AppError("Invalid organization context.", 403);
  }

  return orgId;
};

const getActorId = (req) => {
  const actorId = Number(req.user?.id);
  return Number.isFinite(actorId) ? actorId : null;
};

/* =========================================================
   STANDARD RESPONSE WRAPPER
========================================================= */

const sendSuccess = (res, data) => {
  res.status(200).json({
    success: true,
    data: data || {}
  });
};

/* =========================================================
   GET FULL DASHBOARD SUMMARY
   GET /api/buyer/dashboard/summary
========================================================= */

exports.getDashboard = asyncHandler(async (req, res) => {

  const orgId = getOrgId(req);
  const actorId = getActorId(req);

  const data = await service.getDashboardSummary(orgId);

  /* -------------------------------------------------------
     Non-Blocking Audit Logging
     Dashboard must never wait on logging
  ------------------------------------------------------- */

  if (actorId) {
    logEvent({
      entityType: "BUYER_DASHBOARD",
      entityId: orgId,
      eventType: "DASHBOARD_VIEWED",
      actorId
    }).catch(() => {});
  }

  sendSuccess(res, data);
});

/* =========================================================
   GET SPEND TRENDS
   GET /api/buyer/dashboard/spend-trend
========================================================= */

exports.getSpendTrend = asyncHandler(async (req, res) => {

  const orgId = getOrgId(req);

  const data = await service.getSpendTrend(orgId);

  sendSuccess(res, data);
});

/* =========================================================
   GET SUPPLIER BREAKDOWN
   GET /api/buyer/dashboard/supplier-breakdown
========================================================= */

exports.getSupplierBreakdown = asyncHandler(async (req, res) => {

  const orgId = getOrgId(req);

  const data = await service.getSupplierBreakdown(orgId);

  sendSuccess(res, data);
});