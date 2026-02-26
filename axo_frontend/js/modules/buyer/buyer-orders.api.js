/* =========================================================
   BUYER ORDERS — API LAYER (PRODUCTION SAFE)
   - No UI logic
   - No console logs
   - Clean error propagation
========================================================= */

import { ApiClient } from "../../core/apiClient.js";
import { StorageManager } from "../../core/storage.js";

function handleResponse(response, fallbackMessage) {
  if (!response || response.success !== true) {
    const message =
      response?.message || fallbackMessage || "Request failed";
    throw new Error(message);
  }
  return response.data;
}

export const BuyerOrdersAPI = {

  /* =====================================================
     GET BUYER ORDERS
  ====================================================== */
  async getOrders({ page = 1, limit = 10, status = "" } = {}) {

    let query = `/buyer/purchase-orders?page=${page}&limit=${limit}`;
    if (status) query += `&status=${status}`;

    const response = await ApiClient.get(query);
    const data = handleResponse(response, "Failed to fetch orders");

    // Normalize response
    if (Array.isArray(data)) {
      return {
        orders: data,
        total: data.length
      };
    }

    return {
      orders: data?.orders || data || [],
      total: data?.total || (Array.isArray(data) ? data.length : 0)
    };
  },

  /* =====================================================
     GET SINGLE PO DETAILS
  ====================================================== */
  async getOrderById(poId) {
    const response = await ApiClient.get(
      `/buyer/purchase-orders/${poId}`
    );
    return handleResponse(response, "Unable to load order details");
  },

  /* =====================================================
     GET PO MILESTONES
  ====================================================== */
  async getMilestones(poId) {
    const response = await ApiClient.get(
      `/buyer/purchase-orders/${poId}/milestones`
    );
    return handleResponse(response, "Unable to load milestones");
  },

  /* =====================================================
     GET PO AUDIT TRAIL
  ====================================================== */
  async getPOAuditTrail(poId) {
    const response = await ApiClient.get(
      `/buyer/purchase-orders/${poId}/events`
    );
    return handleResponse(response, "Unable to load audit trail");
  },

  /* =====================================================
     GET PO PAYMENT HISTORY
  ====================================================== */
  async getPOPayments(poId) {
    const response = await ApiClient.get(
      `/buyer/purchase-orders/${poId}/payments`
    );
    return handleResponse(response, "Unable to load payment history");
  },

  /* =====================================================
     DOWNLOAD PO PDF (JWT SAFE + CLEAN)
  ====================================================== */
async downloadPOPDF(poId) {

  const token = localStorage.getItem("axo_access_token");

  if (!token) {
    throw new Error("Session expired. Please login again.");
  }

  const response = await fetch(
    `${window.location.origin}/api/buyer/purchase-orders/${poId}/pdf?ts=${Date.now()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Unable to generate PDF.");
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error("PDF generation failed.");
  }

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `PO-${poId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
},


/* =====================================================
   DOWNLOAD ENTERPRISE PO PACKAGE (JSON EXPORT)
===================================================== */
async downloadPOPackage(poId) {

  const token = localStorage.getItem("axo_access_token");

  if (!token) {
    throw new Error("Session expired. Please login again.");
  }

  const response = await fetch(
    `${window.location.origin}/api/export/po/${poId}?ts=${Date.now()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Unable to download enterprise package.");
  }

  const blob = await response.blob();

  if (!blob || blob.size === 0) {
    throw new Error("Export package generation failed.");
  }

  return blob;
},

  /* =====================================================
     REQUEST PAYMENT
  ====================================================== */
  async requestPayment(poId, milestoneId, amount) {

    const response = await ApiClient.post(
      `/buyer/purchase-orders/${poId}/milestones/${milestoneId}/request-payment`,
      { amount }
    );

    handleResponse(response, "Payment request failed");
    return true;
  },

  /* =====================================================
     RAISE DISPUTE
  ====================================================== */
  async raiseDispute(poId, reason) {

    const response = await ApiClient.post(
      `/buyer/purchase-orders/${poId}/dispute`,
      { reason }
    );

    handleResponse(response, "Unable to raise dispute");
    return true;
  }

};

export default BuyerOrdersAPI;