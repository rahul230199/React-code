/* =========================================================
   AXO NETWORKS — AUTH MANAGER (CLEAN ROUTING VERSION)
   No .html | No Auto Redirects | Session Safe
   ES Module Version (No Global Pollution)
========================================================= */

import { ApiClient as Api } from "./apiClient.js";
import { StorageManager as Storage } from "./storage.js";

/* =======================================================
   ROLE → DEFAULT ROUTE (CLEAN URLS)
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
   LOGIN (NO AUTO REDIRECT)
======================================================= */
async function login(email, password) {

  const response = await Api.post("/auth/login", {
    email,
    password,
  });

  if (!response.success) {
    throw new Error(response.message || "Login failed");
  }

  const { token, must_change_password, user } = response.data;

  // Save session
  Storage.setToken(token);
  Storage.setUser(user);

  return {
    user,
    mustChangePassword: must_change_password,
    redirectUrl: getDefaultRouteByRole(user.role)
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
  }
}

/* =======================================================
   PUBLIC EXPORT
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