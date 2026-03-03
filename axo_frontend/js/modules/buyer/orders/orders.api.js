/* =========================================================
   AXO NETWORKS — ORDERS API LAYER
   Enterprise Hardened | SLA Integrated | Thread Driven
   Cancel Safe | Timeout Safe | Backend Aligned
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

const BASE = "/buyer/orders";

/* =========================================================
   INTERNAL CONTROLLER TRACKING
========================================================= */

const activeControllers = new Map();

/* =========================================================
   HELPERS
========================================================= */

function normalizeResponse(res) {

  if (!res) {
    return { success: false, data: null, message: "Empty response" };
  }

  if (typeof res.success === "boolean") {
    return {
      success: res.success,
      data: res.data ?? null,
      message: res.message ?? null,
      count: res.count ?? null
    };
  }

  return {
    success: true,
    data: res ?? null,
    message: null
  };
}

function validateId(id) {
  const n = Number(id);
  if (!n || isNaN(n)) {
    throw new Error("Invalid identifier");
  }
  return n;
}

function createController(key) {
  cancelRequest(key);
  const controller = new AbortController();
  activeControllers.set(key, controller);
  return controller;
}

function cancelRequest(key) {
  const existing = activeControllers.get(key);
  if (existing) {
    existing.abort();
    activeControllers.delete(key);
  }
}

function withTimeout(promise, ms = 20000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    )
  ]);
}

/* =========================================================
   ORDERS API
========================================================= */

export const OrdersApi = {

  /* =====================================================
     LIST ORDERS
     GET /orders
  ===================================================== */
  async list() {

    const key = "orders-list";
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(BASE)
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     GET FULL ORDER THREAD
     GET /orders/:poId
  ===================================================== */
  async getThread(poId) {

    const id = validateId(poId);
    const key = `thread-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(`${BASE}/${id}`)
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     UPDATE PO STATUS
     POST /orders/:poId/status
  ===================================================== */
  async updateStatus(poId, newStatus) {

    const id = validateId(poId);

    if (!newStatus) {
      throw new Error("New status required");
    }

    const key = `status-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(`${BASE}/${id}/status`, {
          newStatus
        })
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     COMPLETE MILESTONE
     POST /orders/:poId/milestones/complete
  ===================================================== */
  async completeMilestone(poId, payload) {

    const id = validateId(poId);

    if (!payload?.milestoneName) {
      throw new Error("Milestone name required");
    }

    const key = `milestone-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(
          `${BASE}/${id}/milestones/complete`,
          payload
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     SEND MESSAGE
     POST /orders/:poId/messages
  ===================================================== */
  async sendMessage(poId, message) {

    const id = validateId(poId);

    if (!message) {
      throw new Error("Message required");
    }

    const key = `message-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(
          `${BASE}/${id}/messages`,
          { message }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     CONFIRM PAYMENT
     POST /orders/:poId/pay
  ===================================================== */
  async confirmPayment(poId, amount) {

    const id = validateId(poId);

    if (!amount) {
      throw new Error("Amount required");
    }

    const key = `payment-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(
          `${BASE}/${id}/pay`,
          { amount }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     RAISE DISPUTE
     POST /orders/:poId/dispute
  ===================================================== */
  async raiseDispute(poId, reason) {

    const id = validateId(poId);

    if (!reason) {
      throw new Error("Reason required");
    }

    const key = `dispute-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(
          `${BASE}/${id}/dispute`,
          { reason }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     GET SLA RISK (Single PO)
     GET /orders/:poId/sla-risk
  ===================================================== */
  async getSLARisk(poId) {

    const id = validateId(poId);
    const key = `sla-risk-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(`${BASE}/${id}/sla-risk`)
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     SLA DASHBOARD (Aggregate)
     GET /orders/sla/dashboard
  ===================================================== */
  async getSLADashboard() {

    const key = "sla-dashboard";
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(`${BASE}/sla/dashboard`)
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     GET PDF DATA
     GET /orders/:poId/pdf
  ===================================================== */
  async getPDFData(poId) {

    const id = validateId(poId);
    const key = `pdf-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(`${BASE}/${id}/pdf`)
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* =====================================================
     GLOBAL CANCEL (Route Safety)
  ===================================================== */
  cancelAll() {
    activeControllers.forEach(controller => controller.abort());
    activeControllers.clear();
  }

};