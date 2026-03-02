/* =========================================================
   AXO NETWORKS — BUYER RFQ ROUTES
   Enterprise Route Layer
========================================================= */

const express = require("express");
const router = express.Router();

const authorize = require("../../../middlewares/authorize.middleware");
const { validateRequiredFields } = require("../../../middlewares/validation.middleware");

const rfqController = require("./rfq.controller");

/* =========================================================
   CREATE RFQ
========================================================= */
router.post(
  "/",
  authorize("CREATE_RFQ"),
  validateRequiredFields(["part_name", "quantity"]),
  rfqController.createRFQ
);

/* =========================================================
   LIST RFQS
========================================================= */
router.get(
  "/",
  authorize("VIEW_RFQ"),
  rfqController.getRFQQuotes ? rfqController.getRFQs : rfqController.getRFQs
);

/* =========================================================
   SUPPLIER AI RANKING DASHBOARD
   (STATIC ROUTE FIRST — BEFORE :rfqId)
========================================================= */
router.get(
  "/supplier-ranking/dashboard",
  authorize("VIEW_ANALYTICS"),
  rfqController.getSupplierRankingDashboard
);

/* =========================================================
   RFQ INTELLIGENCE VIEW
========================================================= */
router.get(
  "/:rfqId/quotes",
  authorize("VIEW_RFQ"),
  rfqController.getRFQQuotes
);

/* =========================================================
   ACCEPT QUOTE (AUTO PO PIPELINE)
========================================================= */
router.post(
  "/:rfqId/quotes/:quoteId/accept",
  authorize("ACCEPT_QUOTE"),
  rfqController.acceptQuote
);

/* =========================================================
   AI AUDIT REPLAY
========================================================= */
router.get(
  "/:rfqId/audit-replay",
  authorize("VIEW_RFQ"),
  rfqController.getAIReplay
);

/* =========================================================
   CLOSE RFQ
========================================================= */
router.post(
  "/:rfqId/close",
  authorize("CLOSE_RFQ"),
  rfqController.closeRFQ
);

module.exports = router;