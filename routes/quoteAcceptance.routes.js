const express = require("express");
const router = express.Router();

const {
  acceptQuote,
} = require("../src/controllers/quoteAcceptance.controller");

// Buyer accepts quote (transactional)
router.post("/accept", acceptQuote);

module.exports = router;
