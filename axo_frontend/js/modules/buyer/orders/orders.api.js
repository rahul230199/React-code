/* =========================================================
   AXO NETWORKS — ORDERS API LAYER
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

const BASE = "/buyer/orders";
const THREAD_BASE = "/po-thread";

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
     LOAD MESSAGE HISTORY
     GET /po-thread/:poId/messages
  ===================================================== */

  async getMessages(poId) {

    const id = validateId(poId);
    const key = `messages-${id}`;
    createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(`${THREAD_BASE}/${id}/messages`)
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }

  },


  /* =====================================================
     SEND MESSAGE
     POST /po-thread/:poId/messages
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
          `${THREAD_BASE}/${id}/messages`,
          { message }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },


  /* =====================================================
     UPDATE PO STATUS
  ===================================================== */

  async updateStatus(poId, newStatus) {

    const id = validateId(poId);

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
  ===================================================== */

  async completeMilestone(poId, payload) {

    const id = validateId(poId);

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
     CONFIRM PAYMENT
  ===================================================== */

  async confirmPayment(poId, amount) {

    const id = validateId(poId);

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
  ===================================================== */

  async raiseDispute(poId, reason) {

    const id = validateId(poId);

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
     SLA RISK
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
     SLA DASHBOARD
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
     PDF DATA
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
     CANCEL ALL REQUESTS
  ===================================================== */

  cancelAll() {
    activeControllers.forEach(controller => controller.abort());
    activeControllers.clear();
  }

};