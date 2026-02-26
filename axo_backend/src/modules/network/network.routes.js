/* =========================================================
   AXO NETWORKS — NETWORK ROUTES (ENTERPRISE SAFE)
========================================================= */

const express = require("express");
const router = express.Router();

const networkController = require("./network.controller");

const {
  validateRequiredFields,
} = require("../../middlewares/validation.middleware");

const {
  networkLimiter
} = require("../../middlewares/rateLimit.middleware");

const {
  authenticate
} = require("../../middlewares/auth.middleware");

/* =========================================================
   PUBLIC ACCESS REQUEST
========================================================= */
router.post(
  "/request-access",
  networkLimiter,
  validateRequiredFields([
    "company_name",
    "city_state",
    "contact_name",
    "email",
    "phone",
    "primary_product",
    "key_components",
    "manufacturing_locations",
    "monthly_capacity",
    "role_in_ev",
    "why_join_axo"
  ]),
  networkController.submitRequest
);

/* =========================================================
   PROTECTED ROUTES
========================================================= */

router.get(
  "/suppliers",
  authenticate,
  networkController.getNetworkSuppliers
);

router.get(
  "/suppliers/:id",
  authenticate,
  networkController.getSupplierById
);

module.exports = router;