/* =========================================================
   AXO NETWORKS — ADMIN ROUTES
   Protected • Structured • Production Ready
========================================================= */

const express = require("express");
const router = express.Router();

const adminController = require("./admin.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

/* =========================================================
   ALL ROUTES BELOW REQUIRE:
   1️⃣ Valid JWT
   2️⃣ Admin Role
========================================================= */

router.use(authenticate);
router.use(authorizeRoles("admin"));

/* =========================================================
   USERS MANAGEMENT
========================================================= */

// GET /admin/users?role=supplier
router.get("/users", adminController.getAllUsers);

// PATCH /admin/users/:id/status
router.patch("/users/:id/status", adminController.updateUserStatus);

// POST /admin/users/:id/reset-password
router.post("/users/:id/reset-password", adminController.resetUserPassword);

/* =========================================================
   PLATFORM STATS
========================================================= */

// GET /admin/stats
router.get("/stats", adminController.getPlatformStats);

/* =========================================================
   NETWORK ACCESS REQUESTS
========================================================= */

// GET /admin/network-access-requests
router.get(
  "/network-access-requests",
  adminController.getAllNetworkAccessRequests
);
// Approve request
router.post(
  "/network-access-requests/:id/approve",
  adminController.approveNetworkRequest
);

// Reject request
router.post(
  "/network-access-requests/:id/reject",
  adminController.rejectNetworkRequest
);

module.exports = router;