/* =========================================================
   AXO NETWORKS — USERS API
   ENTERPRISE • DETERMINISTIC • NORMALIZED • SAFE
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

/* =========================================================
   ERROR NORMALIZER
========================================================= */
function normalizeError(error) {

  if (!error) return "Unknown error";

  if (typeof error === "string") return error;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message) return error.message;

  return "Request failed";
}

/* =========================================================
   SAFE QUERY BUILDER
========================================================= */
function buildQuery(params = {}) {

  const query = Object.entries(params)
    .filter(([_, v]) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      v !== "all"
    )
    .map(([k, v]) =>
      `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

/* =========================================================
   RESPONSE NORMALIZER
========================================================= */
function normalizeResponse(response) {

  // ApiClient might already unwrap .data
  const payload = response?.data ?? response ?? null;

  return payload;
}

/* =========================================================
   USERS API
========================================================= */

export const UsersAPI = {

  /* =====================================================
     GET USERS (WITH FILTERS)
  ===================================================== */
  async getUsers(options = {}) {

    try {

      const {
        page = 1,
        limit = 10,
        search = "",
        role = "all",
        status = "all",
        organization_id = "all"
      } = options;

      const query = buildQuery({
        page,
        limit,
        search,
        role,
        status,
        organization_id
      });

      const response = await ApiClient.get(`/admin/users${query}`);

      return {
        success: true,
        data: normalizeResponse(response)
      };

    } catch (error) {

      return {
        success: false,
        data: null,
        error: normalizeError(error)
      };
    }
  },

  /* =====================================================
     GET SINGLE USER
  ===================================================== */
  async getUserById(id) {

    if (!id) {
      return { success: false, data: null, error: "User ID required" };
    }

    try {

      const response = await ApiClient.get(`/admin/users/${id}`);

      return {
        success: true,
        data: normalizeResponse(response)
      };

    } catch (error) {

      return {
        success: false,
        data: null,
        error: normalizeError(error)
      };
    }
  },

  /* =====================================================
     UPDATE STATUS
  ===================================================== */
  async updateStatus(id, status) {

    if (!id) {
      return { success: false, data: null, error: "User ID required" };
    }

    try {

      const response = await ApiClient.patch(
        `/admin/users/${id}/status`,
        { status: String(status).toLowerCase() }
      );

      return {
        success: true,
        data: normalizeResponse(response)
      };

    } catch (error) {

      return {
        success: false,
        data: null,
        error: normalizeError(error)
      };
    }
  },

  /* =====================================================
     UPDATE ROLE
  ===================================================== */
  async updateRole(id, role) {

    if (!id) {
      return { success: false, data: null, error: "User ID required" };
    }

    try {

      const response = await ApiClient.patch(
        `/admin/users/${id}/role`,
        { role: String(role).toLowerCase() }
      );

      return {
        success: true,
        data: normalizeResponse(response)
      };

    } catch (error) {

      return {
        success: false,
        data: null,
        error: normalizeError(error)
      };
    }
  },

  /* =====================================================
     SOFT DELETE USER
  ===================================================== */
  async deleteUser(id) {

    if (!id) {
      return { success: false, data: null, error: "User ID required" };
    }

    try {

      const response = await ApiClient.delete(
        `/admin/users/${id}`
      );

      return {
        success: true,
        data: normalizeResponse(response)
      };

    } catch (error) {

      return {
        success: false,
        data: null,
        error: normalizeError(error)
      };
    }
  },

  /* =====================================================
     RESET PASSWORD
  ===================================================== */
  async resetPassword(id) {

    if (!id) {
      return { success: false, data: null, error: "User ID required" };
    }

    try {

      const response = await ApiClient.post(
        `/admin/users/${id}/reset-password`
      );

      return {
        success: true,
        data: normalizeResponse(response)
      };

    } catch (error) {

      return {
        success: false,
        data: null,
        error: normalizeError(error)
      };
    }
  }

};

export default UsersAPI;