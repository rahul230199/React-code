const express = require("express");
const router = express.Router();

const rfqMessageController = require("../src/controllers/rfqMessage.controller");

// Send message (Buyer or Supplier)
router.post("/", rfqMessageController.sendMessage);

// Get messages for an RFQ
router.get("/rfq/:rfq_id", rfqMessageController.getMessagesByRFQ);

module.exports = router;
