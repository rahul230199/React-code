const express = require("express");
const { authenticate, authorizeAdmin } =
  require("../middleware/auth.middleware");

const {
  createNetworkRequest,
  getAllNetworkRequests,
  updateNetworkRequestStatus
} = require("../src/controllers/networkRequest.controller");

const router = express.Router();

router.post("/", createNetworkRequest);

router.get("/", authenticate, authorizeAdmin, getAllNetworkRequests);

router.put("/:id/status",
  authenticate,
  authorizeAdmin,
  updateNetworkRequestStatus
);

module.exports = router;