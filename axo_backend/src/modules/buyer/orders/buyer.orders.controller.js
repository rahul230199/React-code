/* =========================================================
   AXO NETWORKS — BUYER ORDERS CONTROLLER
   Enterprise Intelligence Layer Controller
   - Guardrail Enforced
   - Behavior Driven
   - Reliability Integrated
========================================================= */

const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.orders.service");

/* =========================================================
   GET ALL BUYER ORDERS
========================================================= */
exports.getBuyerOrders = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;

  const orders = await service.getBuyerOrders(buyerOrgId);

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

/* =========================================================
   GET FULL PO THREAD
========================================================= */
exports.getOrderThread = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;
  const { poId } = req.params;

  const data = await service.getFullOrderThread({
    poId,
    buyerOrgId
  });

  res.status(200).json({
    success: true,
    data
  });
});

/* =========================================================
   UPDATE PO STATUS (GUARDRAIL PROTECTED)
========================================================= */
exports.updatePOStatus = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;
  const userId = req.user.id;
  const { poId } = req.params;
  const { newStatus } = req.body;

  await service.updatePOStatus({
    poId,
    buyerOrgId,
    newStatus,
    userId
  });

  res.status(200).json({
    success: true,
    message: "PO status updated successfully."
  });
});

/* =========================================================
   UPDATE MILESTONE (AUTO DISCIPLINE LOGGED)
========================================================= */
exports.updateMilestone = asyncHandler(async (req, res) => {

  const userId = req.user.id;
  const { poId } = req.params;
  const { milestoneName } = req.body;

  await service.updateMilestone({
    poId,
    milestoneName,
    userId
  });

  res.status(200).json({
    success: true,
    message: "Milestone updated successfully."
  });
});

/* =========================================================
   CONFIRM PAYMENT (TRANSACTION SAFE)
========================================================= */
exports.confirmPayment = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;
  const userId = req.user.id;
  const { poId } = req.params;
  const { amount } = req.body;

  await service.confirmPayment({
    poId,
    buyerOrgId,
    userId,
    amount
  });

  res.status(200).json({
    success: true,
    message: "Payment confirmed successfully."
  });
});

/* =========================================================
   RAISE DISPUTE (AUTO EVENT + RELIABILITY)
========================================================= */
exports.raiseDispute = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;
  const userId = req.user.id;
  const { poId } = req.params;
  const { reason } = req.body;

  await service.raiseDispute({
    poId,
    buyerOrgId,
    userId,
    reason
  });

  res.status(201).json({
    success: true,
    message: "Dispute raised successfully."
  });
});

/* =========================================================
   OEM RELIABILITY MIRROR SCORE
========================================================= */
exports.getOEMReliability = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;

  const result = await service.calculateOEMReliability(buyerOrgId);

  res.status(200).json({
    success: true,
    data: result
  });
});

/* =========================================================
   REAL-TIME RISK DASHBOARD
========================================================= */
exports.getRiskDashboard = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;

  const result = await service.aggregateRiskDashboard(buyerOrgId);

  res.status(200).json({
    success: true,
    data: result
  });
});

/* =========================================================
   ANOMALY DETECTION
========================================================= */
exports.getAnomalies = asyncHandler(async (req, res) => {

  const buyerOrgId = req.user.organization_id;

  const result = await service.detectAnomalies(buyerOrgId, "buyer");

  res.status(200).json({
    success: true,
    data: result
  });
});

/* =========================================================
   GENERATE PO PDF (SAFE PLACEHOLDER)
========================================================= */
exports.generatePOPdf = asyncHandler(async (req, res) => {

  const { poId } = req.params;

  const pdf = await service.generatePOPdf(poId);

  res.status(200).json({
    success: true,
    data: pdf
  });
});