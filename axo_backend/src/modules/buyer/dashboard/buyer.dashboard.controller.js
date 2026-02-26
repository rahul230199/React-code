const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.dashboard.service");
const { logEvent } = require("../../../utils/eventLogger");

exports.getDashboard = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;

  const data = await service.getDashboardSummary(orgId);

  // Audit Event
  await logEvent({
    entityType: "BUYER_DASHBOARD",
    entityId: orgId,
    eventType: "DASHBOARD_VIEWED",
    actorId: req.user.id
  });

  res.json({
    success: true,
    data
  });

});

exports.getSpendTrend = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;

  const data = await service.getSpendTrend(orgId);

  res.json({
    success: true,
    data
  });

});

exports.getSupplierBreakdown = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;

  const data = await service.getSupplierBreakdown(orgId);

  res.json({
    success: true,
    data
  });

});

exports.getOrderDistribution = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;

  const data = await service.getOrderDistribution(orgId);

  res.json({
    success: true,
    data
  });

});