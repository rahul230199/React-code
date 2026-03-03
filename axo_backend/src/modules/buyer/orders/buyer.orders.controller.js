/* =========================================================
   AXO NETWORKS — ORDERS CONTROLLER (FINAL ENTERPRISE)
   Role Aware | SLA Integrated | Milestone Driven
   Fully Aligned With Service Layer
========================================================= */

const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.orders.service");

/* =========================================================
   LIST ORDERS (ROLE AWARE)
========================================================= */
exports.getOrders = asyncHandler(async (req, res) => {

  const orders = await service.getOrders(req.user);

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

  const { poId } = req.params;

  const data = await service.getFullOrderThread({
    poId,
    user: req.user
  });

  res.status(200).json({
    success: true,
    data
  });

});

/* =========================================================
   UPDATE PO STATUS
========================================================= */
exports.updatePOStatus = asyncHandler(async (req, res) => {

  const { poId } = req.params;
  const { newStatus } = req.body;

  await service.updatePOStatus({
    poId,
    newStatus,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: "PO status updated successfully."
  });

});

/* =========================================================
   COMPLETE MILESTONE (FULL CRUD + SLA LOGIC)
========================================================= */
exports.completeMilestone = asyncHandler(async (req, res) => {

  const { poId } = req.params;
  const { milestoneName, evidence_url, remarks } = req.body;

  await service.completeMilestone({
    poId,
    milestoneName,
    evidence_url,
    remarks,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: "Milestone completed successfully."
  });

});

/* =========================================================
   SEND MESSAGE (PO THREAD)
========================================================= */
exports.sendMessage = asyncHandler(async (req, res) => {

  const { poId } = req.params;
  const { message } = req.body;

  await service.sendMessage({
    poId,
    message,
    user: req.user
  });

  res.status(201).json({
    success: true,
    message: "Message sent successfully."
  });

});

/* =========================================================
   CONFIRM PAYMENT
========================================================= */
exports.confirmPayment = asyncHandler(async (req, res) => {

  const { poId } = req.params;
  const { amount } = req.body;

  await service.confirmPayment({
    poId,
    amount,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: "Payment confirmed successfully."
  });

});

/* =========================================================
   RAISE DISPUTE (AUTO FLAG + SLA IMPACT)
========================================================= */
exports.raiseDispute = asyncHandler(async (req, res) => {

  const { poId } = req.params;
  const { reason } = req.body;

  await service.raiseDispute({
    poId,
    reason,
    user: req.user
  });

  res.status(201).json({
    success: true,
    message: "Dispute raised successfully."
  });

});

/* =========================================================
   SLA RISK — SINGLE PO
========================================================= */
exports.getSLARisk = asyncHandler(async (req, res) => {

  const { poId } = req.params;

  const result = await service.calculateSLARisk(poId, req.user);

  res.status(200).json({
    success: true,
    data: result
  });

});

/* =========================================================
   SLA DASHBOARD — ROLE AWARE
========================================================= */
exports.getSLADashboard = asyncHandler(async (req, res) => {

  const result = await service.aggregateSLARisk(req.user);

  res.status(200).json({
    success: true,
    data: result
  });

});

/* =========================================================
   GENERATE PO PDF DATA (FOR PDF ENGINE)
========================================================= */
exports.generatePOPdf = asyncHandler(async (req, res) => {

  const { poId } = req.params;

  const pdfData = await service.generatePOPdfData(poId, req.user);

  res.status(200).json({
    success: true,
    data: pdfData
  });

});