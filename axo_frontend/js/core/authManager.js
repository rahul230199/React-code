/* =========================================================
   AXO NETWORKS — AUTH MANAGER (ENTERPRISE HARDENED)
   Clean Routing · Defensive Validation · Session Safe
========================================================= */

import { ApiClient as Api } from "./apiClient.js";
import { StorageManager as Storage } from "./storage.js";

/* =======================================================
   ROLE → DEFAULT ROUTE
======================================================= */
function getDefaultRouteByRole(role) {

  switch (role) {

    case "admin":
    case "super_admin":
      return "/admin-dashboard";

    case "buyer":
      return "/buyer-dashboard";

    case "supplier":
      return "/supplier";

    default:
      return "/login";
  }
}

/* =======================================================
   LOGIN
======================================================= */
async function login(email, password) {

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const response = await Api.post("/auth/login", {
    email,
    password,
  });

  if (!response || response.success !== true || !response.data) {
    throw new Error(
      response?.message || "Login failed"
    );
  }

  const {
    token,
    must_change_password,
    user
  } = response.data;

  if (!token || !user) {
    throw new Error("Invalid login response");
  }

  // Attach must_change_password to stored user
  const safeUser = {
    ...user,
    must_change_password: !!must_change_password
  };

  Storage.setToken(token);
  Storage.setUser(safeUser);

  return {
    user: safeUser,
    mustChangePassword: !!must_change_password,
    redirectUrl: getDefaultRouteByRole(safeUser.role)
  };
}

/* =======================================================
   LOGOUT
======================================================= */
function logout() {
  Storage.clearSession();
  window.location.href = "/login";
}

/* =======================================================
   GET CURRENT USER
======================================================= */
function getCurrentUser() {
  return Storage.getUser();
}

/* =======================================================
   GET CURRENT ROLE
======================================================= */
function getCurrentRole() {
  const user = getCurrentUser();
  return user?.role || null;
}

/* =======================================================
   REQUIRE AUTH
======================================================= */
function requireAuth() {

  if (!Storage.isAuthenticated()) {
    window.location.href = "/login";
    return false;
  }

  return true;
}

/* =======================================================
   EXPORT
======================================================= */
export const AuthManager = {
  login,
  logout,
  getCurrentUser,
  getCurrentRole,
  requireAuth,
  getDefaultRouteByRole
};

export default AuthManager;