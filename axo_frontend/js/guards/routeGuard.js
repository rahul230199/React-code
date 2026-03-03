/* =========================================================
   AXO NETWORKS — ROUTE GUARD (ENTERPRISE SAFE)
   Fixed Password Reset Loop + Clean Role Handling
========================================================= */

import { StorageManager as Storage } from "../core/storage.js";
import { PermissionManager as Permission } from "../core/permissionManager.js";
import { AuthManager as Auth } from "../core/authManager.js";

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function redirect(path) {
  if (window.location.pathname !== path) {
    window.location.href = path;
  }
}

/* =========================================================
   REQUIRE AUTH
========================================================= */

function requireAuth() {

  // Not logged in
  if (!Storage.isAuthenticated()) {
    redirect("/login");
    return false;
  }

  const user = Auth.getCurrentUser();
  if (!user) {
    redirect("/login");
    return false;
  }

  const currentPath = window.location.pathname;

  // 🔐 Enforce password reset
  if (
    user.must_change_password === true &&
    !currentPath.includes("change-password")
  ) {
    redirect("/change-password");
    return false;
  }

  return true;
}

/* =========================================================
   REQUIRE ROLE
========================================================= */

function requireRole(allowedRoles = []) {

  if (!requireAuth()) return false;

  const user = Auth.getCurrentUser();
  if (!user) return false;

  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!rolesArray.includes(user.role)) {
    redirectToDashboard();
    return false;
  }

  return true;
}

/* =========================================================
   REQUIRE PERMISSION
========================================================= */

function requirePermission(permission) {

  if (!requireAuth()) return false;

  if (!Permission.has(permission)) {
    redirectToDashboard();
    return false;
  }

  return true;
}

/* =========================================================
   ROLE-BASED DASHBOARD REDIRECT
========================================================= */

function redirectToDashboard() {

  const role = Auth.getCurrentRole();

  switch (role) {

    case "admin":
    case "super_admin":
      redirect("/admin-dashboard");
      break;

    case "buyer":
      redirect("/buyer-dashboard");
      break;

    case "supplier":
      redirect("/supplier");
      break;

    default:
      redirect("/login");
  }
}

/* =========================================================
   MAIN PROTECT METHOD
========================================================= */

function protect(options = {}) {

  const {
    requireAuth: needAuth,
    role,
    permission
  } = options;

  if (needAuth && !requireAuth()) return false;

  if (role) {
    const rolesArray = Array.isArray(role) ? role : [role];
    const user = Auth.getCurrentUser();

    if (!user || !rolesArray.includes(user.role)) {
      redirectToDashboard();
      return false;
    }
  }

  if (permission && !Permission.has(permission)) {
    redirectToDashboard();
    return false;
  }

  Permission.applyPermissionsToDOM();

  return true;
}

/* =========================================================
   EXPORT
========================================================= */

export const RouteGuard = {
  protect,
  requireAuth,
  requireRole,
  requirePermission
};

export default RouteGuard;
