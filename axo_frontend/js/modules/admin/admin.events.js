/* =========================================================
   AXO NETWORKS — ADMIN EVENTS (ENTERPRISE STABLE VERSION)
   ES Module Version
========================================================= */

import { AdminState as State } from "./admin.state.js";
import { AdminAPI as API } from "./admin.api.js";
import { AdminRender as Render } from "./admin.render.js";
import { AdminNetworkRender as NetworkRender } from "./admin-network.render.js";
import { Toast } from "../../core/toast.js";

/* =========================================================
   LOCAL LOADER HELPERS (UNCHANGED BEHAVIOR)
========================================================= */

function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

export const AdminEvents = {

  /* =====================================================
     INIT
  ===================================================== */
  init() {
    this.bindToggle();
    this.bindRefresh();
    this.bindExport();
    this.bindFilters();
    this.bindUserFilters();
    this.bindUserActions();
    this.bindResetModal();
  },

  /* =====================================================
     TOGGLE USERS / REQUESTS
  ===================================================== */
  bindToggle() {

    const btn = document.getElementById("usersViewBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {

      if (State.getLoading()) return;

      const usersSection    = document.getElementById("usersSection");
      const requestsSection = document.getElementById("requestsSection");
      const statsSection    = document.getElementById("statsSection");
      const toggleText      = document.getElementById("toggleText");
      const toggleIcon      = document.getElementById("toggleIcon");

      btn.disabled = true;

      try {

        if (State.getCurrentView() === "requests") {

          statsSection.style.display    = "none";
          requestsSection.style.display = "none";
          usersSection.style.display    = "block";

          toggleText.textContent = "Network Access";
          toggleIcon.className   = "fas fa-layer-group";

          State.setCurrentView("users");
          await this.loadUsers();

        } else {

          usersSection.style.display    = "none";
          statsSection.style.display    = "grid";
          requestsSection.style.display = "block";

          toggleText.textContent = "Users";
          toggleIcon.className   = "fas fa-users";

          State.setCurrentView("requests");
          await this.loadRequests();
        }

      } finally {
        btn.disabled = false;
      }

    });
  },

  /* =====================================================
     LOAD REQUESTS
  ===================================================== */
  async loadRequests() {

    try {

      State.setLoading(true);
      showLoader();

      const filters = State.getFilters();
      const pagination = State.getPagination();

      const response = await API.getNetworkRequests({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (!response?.success) throw new Error();

      State.setRequests(response.data);
      NetworkRender.renderRequestsTable(State.getRequests());

    } catch {
      Toast.error("Failed to load requests");
    } finally {
      State.setLoading(false);
      hideLoader();
    }
  },

  /* =====================================================
     LOAD USERS
  ===================================================== */
  async loadUsers(role = null) {

    try {

      State.setLoading(true);
      showLoader();

      const response = await API.getUsers({ role });
      if (!response?.success) throw new Error();

      State.setUsers(response.data);
      Render.renderUsersTable(State.getUsers());

    } catch {
      Toast.error("Failed to load users");
    } finally {
      State.setLoading(false);
      hideLoader();
    }
  },

  /* =====================================================
     FILTERS — NETWORK REQUESTS
  ===================================================== */
  bindFilters() {

    const searchInput  = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const startDate    = document.getElementById("startDate");
    const endDate      = document.getElementById("endDate");

    const applyFilters = async () => {

      State.setPage(1);

      State.setFilters({
        search: searchInput?.value || null,
        status: statusFilter?.value !== "ALL"
                  ? statusFilter?.value
                  : null,
        start_date: startDate?.value || null,
        end_date: endDate?.value || null,
      });

      await this.loadRequests();
    };

    searchInput?.addEventListener(
      "input",
      this.debounce(applyFilters, 500)
    );

    statusFilter?.addEventListener("change", applyFilters);
    startDate?.addEventListener("change", applyFilters);
    endDate?.addEventListener("change", applyFilters);
  },

  /* =====================================================
     USER ROLE FILTER
  ===================================================== */
  bindUserFilters() {

    const roleFilter = document.getElementById("userRoleFilter");
    if (!roleFilter) return;

    roleFilter.addEventListener("change", async () => {

      const role =
        roleFilter.value === "ALL"
          ? null
          : roleFilter.value;

      await this.loadUsers(role);
    });
  },

  /* =====================================================
     USER ACTIONS
  ===================================================== */
  bindUserActions() {

    document.addEventListener("click", async (e) => {

      const resetBtn  = e.target.closest(".reset-btn");
      const toggleBtn = e.target.closest(".toggle-btn");

      if (resetBtn) {
        const id = Number(resetBtn.dataset.id);
        await this.handleReset(id);
      }

      if (toggleBtn) {

        const id = Number(toggleBtn.dataset.id);
        const currentStatus = toggleBtn.dataset.status;
        const newStatus =
          currentStatus === "active"
            ? "inactive"
            : "active";

        await this.handleStatusToggle(id, newStatus);
      }

    });
  },

  async handleReset(id) {

    try {

      showLoader();

      const response = await API.resetUserPassword(id);
      if (!response?.success) throw new Error();

      const { user, temporary_password } = response.data;

      document.getElementById("resetUserEmail").textContent =
        user.email;

      document.getElementById("resetTempPassword").value =
        temporary_password;

      document.getElementById("resetPasswordModal")
        .style.display = "flex";

      Toast.success("Password reset successful");

    } catch {
      Toast.error("Password reset failed");
    } finally {
      hideLoader();
    }
  },

  async handleStatusToggle(id, status) {

    try {

      showLoader();

      const response =
        await API.updateUserStatus(id, status);

      if (!response?.success) throw new Error();

      Toast.success(`User ${status} successfully`);
      await this.loadUsers();

    } catch {
      Toast.error("Status update failed");
    } finally {
      hideLoader();
    }
  },

  /* =====================================================
     REFRESH
  ===================================================== */
  bindRefresh() {

    const btn = document.getElementById("refreshBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {

      if (State.getCurrentView() === "requests") {
        await this.loadRequests();
      } else {
        await this.loadUsers();
      }

      Toast.success("Data refreshed");
    });
  },

  /* =====================================================
     EXPORT CSV
  ===================================================== */
  bindExport() {

    const btn = document.getElementById("exportBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {

      const data = State.getRequests();
      if (!data.length) {
        Toast.error("No data to export");
        return;
      }

      const csv = data.map(r =>
        `${r.id},${r.company_name},${r.email},${r.status}`
      ).join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");

      link.href = URL.createObjectURL(blob);
      link.download = "network_requests.csv";
      link.click();

      Toast.success("Export completed");
    });
  },

  /* =====================================================
     RESET MODAL
  ===================================================== */
  bindResetModal() {

    const modal = document.getElementById("resetPasswordModal");
    if (!modal) return;

    modal.querySelector(".close-reset-btn")
      ?.addEventListener("click", () => {
        modal.style.display = "none";
      });

    modal.querySelector(".copy-reset-btn")
      ?.addEventListener("click", async () => {

        const input =
          document.getElementById("resetTempPassword");

        await navigator.clipboard.writeText(input.value);
        Toast.success("Password copied");
      });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  },

  /* =====================================================
     DEBOUNCE
  ===================================================== */
  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

};

export default AdminEvents;