const express = require("express");
const router = express.Router();

const quoteController = require("../src/controllers/quote.controller");

// Supplier submits quote
router.post("/", quoteController.submitQuote);

// Buyer views quotes for RFQ
router.get("/rfq/:rfq_id", quoteController.getQuotesByRFQ);

// Get single quote
router.get("/:id", quoteController.getQuoteById);

module.exports = router;
