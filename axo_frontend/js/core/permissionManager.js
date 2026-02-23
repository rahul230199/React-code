/* =========================================================
   AXO NETWORKS — PERMISSION MANAGER
   Frontend RBAC Mirror (Synced with Backend)
========================================================= */

import { StorageManager as Storage } from "./storage.js";

/* =======================================================
   ROLE PERMISSION MATRIX (Synced)
======================================================= */
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

    // Orders
    "VIEW_ORDERS",
    "REQUEST_PAYMENT",
    "APPROVE_PAYMENT",
    "PAY_MILESTONE",
    "RAISE_DISPUTE",

    // Notifications
    "VIEW_NOTIFICATIONS",
  ],

  supplier: [
    "VIEW_OPEN_RFQS",
    "SUBMIT_QUOTE",
    "VIEW_SUPPLIER_POS",
    "ACCEPT_PO",
    "UPDATE_MILESTONE",
  ],
};

/* =======================================================
   GET CURRENT ROLE
======================================================= */
function getCurrentRole() {
  const user = Storage.getUser();
  return user?.role || null;
}

/* =======================================================
   CHECK PERMISSION
======================================================= */
function has(permission) {
  const role = getCurrentRole();
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  if (permissions.includes("*")) return true;

  return permissions.includes(permission);
}

/* =======================================================
   DOM AUTO-HIDE
======================================================= */
function applyPermissionsToDOM() {
  const elements = document.querySelectorAll("[data-permission]");

  elements.forEach((el) => {
    const permission = el.getAttribute("data-permission");

    if (!has(permission)) {
      el.style.display = "none";
    }
  });
}

/* =======================================================
   EXPORT
======================================================= */
export const PermissionManager = {
  has,
  applyPermissionsToDOM,
};

export default PermissionManager;