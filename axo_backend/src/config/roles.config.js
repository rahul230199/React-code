/**
 * AXO NETWORKS
 * Enterprise Role Permission Matrix
 */

const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  BUYER: "buyer",
  SUPPLIER: "supplier",
};

const ROLE_PERMISSIONS = {
  super_admin: ["*"],

  admin: [
    "VIEW_USERS",
    "MANAGE_USERS",
    "VIEW_STATS",
    "VIEW_NETWORK_REQUESTS",
    "APPROVE_NETWORK_REQUEST",
    "REJECT_NETWORK_REQUEST",
    "VIEW_PO",
    "FORCE_PO_ACTION",
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "VIEW_DISPUTES",
    "RESOLVE_DISPUTE",
  ],

  buyer: [
    "VIEW_BUYER_DASHBOARD",
    "CREATE_RFQ",
    "VIEW_RFQ",
    "ACCEPT_QUOTE",
    "REJECT_QUOTE",
    "PAY_MILESTONE",
    "RAISE_DISPUTE",
  ],

  supplier: [
    "VIEW_OPEN_RFQS",
    "SUBMIT_QUOTE",
    "VIEW_SUPPLIER_POS",
    "ACCEPT_PO",
    "UPDATE_MILESTONE",
  ],
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
};

