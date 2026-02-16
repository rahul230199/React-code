const express = require("express");
const router = express.Router();
const networkController = require("./network.controller");

console.log("✅ Network routes loaded");

router.post("/request-access", networkController.submitRequest);

module.exports = router;