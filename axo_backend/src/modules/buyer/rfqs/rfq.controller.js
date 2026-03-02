/* =========================================================
   AXO NETWORKS — BUYER RFQ CONTROLLER
   Enterprise Thin HTTP Layer
========================================================= */

const asyncHandler = require("../../../utils/asyncHandler");
const rfqService = require("./rfq.service");

/* =========================================================
   CREATE RFQ
========================================================= */
exports.createRFQ = asyncHandler(async (req, res) => {

  const result = await rfqService.createRFQ({
    body: req.body,
    user: req.user
  });

  res.status(201).json({
    success: true,
    message: "RFQ created successfully",
    data: result
  });

});

/* =========================================================
   ACCEPT QUOTE (AUTO PO + DECISION LOGGING)
========================================================= */
exports.acceptQuote = asyncHandler(async (req, res) => {

  const result = await rfqService.acceptQuoteFromRFQ({
    params: req.params,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: result.po
  });

});

/* =========================================================
   RFQ INTELLIGENCE VIEW
========================================================= */
exports.getRFQQuotes = asyncHandler(async (req, res) => {

  const result = await rfqService.getRFQQuotes({
    params: req.params,
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: "RFQ intelligence analysis completed",
    data: result
  });

});

/* =========================================================
   AI AUDIT REPLAY ENGINE
========================================================= */
exports.getAIReplay = asyncHandler(async (req, res) => {

  const result = await rfqService.getAIReplay({
    params: req.params
  });

  res.status(200).json({
    success: true,
    message: "AI decision replay loaded",
    data: result
  });

});

/* =========================================================
   SUPPLIER AI RANKING DASHBOARD
========================================================= */
exports.getSupplierRankingDashboard = asyncHandler(async (req, res) => {

  const result =
    await rfqService.getSupplierAIRankingDashboard();

  res.status(200).json({
    success: true,
    message: "Supplier AI ranking dashboard loaded",
    data: result
  });

});

/* =========================================================
   CLOSE RFQ MANUALLY
========================================================= */
exports.closeRFQ = asyncHandler(async (req, res) => {

  const result = await rfqService.closeRFQ({
    params: req.params,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: result.message
  });

});

/* =========================================================
   LIST RFQS
========================================================= */
exports.getRFQs = asyncHandler(async (req, res) => {

  const result = await rfqService.getRFQs({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    message: "RFQs fetched successfully",
    data: result
  });

});