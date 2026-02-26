/* =========================================================
   AXO NETWORKS — PO THREAD ROUTES
========================================================= */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../middlewares/auth.middleware");
const controller = require("./poThread.controller");

router.post("/:poId/messages", authenticate, controller.sendMessage);
router.get("/:poId/messages", authenticate, controller.getMessages);

module.exports = router;