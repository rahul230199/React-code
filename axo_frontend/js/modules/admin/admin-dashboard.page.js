/* =========================================================
   AXO NETWORKS — ADMIN DASHBOARD ENTRY (ENTERPRISE STABLE)
   ES Module Version
   - Safe initialization
   - No double calls
   - Fail-safe modules
   - Clean startup sequence
========================================================= */

import { RouteGuard } from "../../guards/routeGuard.js";
import { Toast } from "../../core/toast.js";
import { AuthManager } from "../../core/authManager.js";

import { AdminState } from "./admin.state.js";
import { AdminEvents } from "./admin.events.js";
import { AdminNetworkEvents } from "./admin-network.events.js";
import { AdminAPI } from "./admin.api.js";

/* =========================================================
   SAFE INITIALIZATION WRAPPER
========================================================= */

let __ADMIN_INITIALIZED__ = false;

async function safeInitializeAdminDashboard() {

  try {

    // Prevent double initialization
    if (__ADMIN_INITIALIZED__) return;
    __ADMIN_INITIALIZED__ = true;

    await initializeAdminDashboard();

  } catch (err) {

    console.error("Admin initialization failed:", err);
    Toast?.error("Failed to initialize dashboard");

  }
}

/* =========================================================
   MAIN INIT
========================================================= */
async function initializeAdminDashboard() {

  /* =========================
     ROUTE PROTECTION
  ========================== */
  RouteGuard.protect({
    requireAuth: true,
    role: ["admin", "super_admin"],
    permission: "VIEW_DASHBOARD"
  });

  /* =========================
     USER INFO
  ========================== */
  injectAdminUserInfo();

  /* =========================
     DEFAULT VIEW STATE
  ========================== */
  AdminState?.setCurrentView?.("requests");

  /* =========================
     INIT EVENTS (SAFE)
  ========================== */
  AdminEvents?.init?.();
  AdminNetworkEvents?.bindNetworkEvents?.();

  /* =========================
     LOAD DATA SEQUENCE
  ========================== */
  await loadDashboardKPIs();

  if (AdminEvents?.loadRequests) {
    await AdminEvents.loadRequests();
  }
}

/* =========================================================
   LOAD DASHBOARD KPI
========================================================= */
async function loadDashboardKPIs() {

  try {

    showLoader();

    const response = await AdminAPI.getDashboard();
    if (!response?.success) throw new Error();

    const network = response.data?.network_requests || {};

    setText("totalSubmissions", network.total_requests ?? 0);
    setText("pendingCount", network.pending ?? 0);
    setText("approvedCount", network.approved ?? 0);
    setText("rejectedCount", network.rejected ?? 0);

  } catch (err) {

    console.error("Dashboard KPI error:", err);
    Toast?.error("Failed to load dashboard stats");

  } finally {

    hideLoader();

  }
}

/* =========================================================
   HELPERS
========================================================= */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? 0;
}

function injectAdminUserInfo() {

  const user = AuthManager.getCurrentUser();
  if (!user) return;

  const nameEl = document.getElementById("adminName");
  const roleEl = document.getElementById("adminRole");

  if (nameEl) nameEl.textContent = user.email || "Admin";
  if (roleEl) roleEl.textContent = user.role || "Administrator";

  document.getElementById("logoutBtn")
    ?.addEventListener("click", () => AuthManager.logout());
}

/* =========================================================
   GLOBAL LOADER (SAFE)
========================================================= */

function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

/* =========================================================
   START
========================================================= */
document.addEventListener("DOMContentLoaded", safeInitializeAdminDashboard);