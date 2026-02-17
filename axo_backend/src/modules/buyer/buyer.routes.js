/* =========================================================
   AXO NETWORKS — BUYER ROUTES
   Protected • Organization Scoped • Production Ready
========================================================= */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const buyerController = require("./buyer.controller");

/* =========================================================
   ALL BUYER ROUTES REQUIRE:
   1️⃣ Valid JWT
   2️⃣ Buyer Role
========================================================= */

router.use(authenticate);
router.use(authorizeRoles("buyer"));

/* =========================================================
   DASHBOARD
========================================================= */

// GET /api/buyer/dashboard-stats
router.get("/dashboard-stats", buyerController.getDashboardStats);

router.post("/rfqs", authenticate, authorizeRoles("buyer"), buyerController.createRFQ);

router.get("/rfqs", authenticate, authorizeRoles("buyer"), buyerController.getBuyerRFQs);

/* NEW: Get Quotes for RFQ */
router.get("/rfqs/:rfqId/quotes", buyerController.getQuotesForRFQ);

/* Accept Quote */
router.post("/quotes/:id/accept", buyerController.acceptQuote);

/* Reject Quote (optional) */
router.post("/quotes/:id/reject", buyerController.rejectQuote);

module.exports = router;