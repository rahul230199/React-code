/* =========================================================
   AXO NETWORKS — ADMIN API LAYER (ENTERPRISE DYNAMIC)
   ES Module Version
   Backend-Aligned, Pagination Ready, Filter Ready
========================================================= */

import { ApiClient as API } from "../../core/apiClient.js";

/* =======================================================
   HELPER — BUILD QUERY STRING SAFELY
======================================================= */
function buildQuery(params = {}) {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) =>
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

export const AdminAPI = {

  /* ===================================================
     DASHBOARD KPI
  =================================================== */
  async getDashboard() {
    return API.get("/admin/dashboard");
  },

  async getStats() {
    return API.get("/admin/stats");
  },

  /* ===================================================
     NETWORK ACCESS REQUESTS (PAGINATED + FILTERED)
     Backend Contract:
     /admin/network-access-requests?page=&limit=&status=&search=&start_date=&end_date=
  =================================================== */
  async getNetworkRequests(options = {}) {

    const {
      page = 1,
      limit = 10,
      status,
      search,
      start_date,
      end_date
    } = options;

    const query = buildQuery({
      page,
      limit,
      status,
      search,
      start_date,
      end_date
    });

    const response = await API.get(
      `/admin/network-access-requests${query}`
    );

    return response;
  },

  async approveNetworkRequest(id, comment) {
    return API.post(
      `/admin/network-access-requests/${id}/approve`,
      { comment }
    );
  },

  async rejectNetworkRequest(id, comment) {
    return API.post(
      `/admin/network-access-requests/${id}/reject`,
      { comment }
    );
  },

  /* ===================================================
     USERS (FILTER READY)
     Backend supports ?role=
  =================================================== */
  async getUsers(options = {}) {

    const { role } = options;

    const query = buildQuery({ role });

    return API.get(`/admin/users${query}`);
  },

  async updateUserStatus(id, status) {

    const normalizedStatus = String(status).toLowerCase();

    return API.patch(
      `/admin/users/${id}/status`,
      { status: normalizedStatus }
    );
  },

  async resetUserPassword(id) {
    return API.post(
      `/admin/users/${id}/reset-password`
    );
  }

};

export default AdminAPI;