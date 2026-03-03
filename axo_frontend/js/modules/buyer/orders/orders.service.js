/* =========================================================
   AXO NETWORKS — ORDERS SERVICE
   Enterprise Orchestrator | SLA Driven | Thread Safe
   Optimistic Ready | Route Safe | Backend Aligned
========================================================= */

import { OrdersApi } from "./orders.api.js";
import { OrdersState } from "./orders.state.js";
import Toast from "../../../core/toast.js";

/* =========================================================
   INTERNAL ERROR NORMALIZER
========================================================= */

function normalizeError(err, fallback) {
  if (!err) return fallback;
  if (err.message) return err.message;
  if (err?.data?.message) return err.data.message;
  return fallback;
}

/* =========================================================
   SERVICE
========================================================= */

export const OrdersService = {

  /* =====================================================
     BOOTSTRAP ORDERS LIST + SLA DASHBOARD
  ===================================================== */
  async bootstrap() {

    try {

      OrdersState.setLoading("list", true);
      OrdersState.setLoading("slaDashboard", true);

      const [ordersRes, slaRes] = await Promise.all([
        OrdersApi.list(),
        OrdersApi.getSLADashboard()
      ]);

      if (!ordersRes.success) {
        throw new Error(ordersRes.message || "Failed to load orders");
      }

      OrdersState.setOrders(ordersRes.data || []);

      if (slaRes.success) {
        OrdersState.setSLADashboard(slaRes.data);
      }

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to load orders")
      );

    } finally {

      OrdersState.setLoading("list", false);
      OrdersState.setLoading("slaDashboard", false);
    }
  },

  /* =====================================================
     LOAD FULL ORDER THREAD
  ===================================================== */
  async loadThread(poId) {

    if (!poId) return;

    try {

      OrdersState.setLoading("thread", true);
      OrdersState.setSelectedOrder(poId);

      const [threadRes, riskRes] = await Promise.all([
        OrdersApi.getThread(poId),
        OrdersApi.getSLARisk(poId)
      ]);

      if (!threadRes.success) {
        throw new Error(threadRes.message || "Failed to load thread");
      }

      OrdersState.setOrderThread(threadRes.data);

      if (riskRes.success) {
        OrdersState.setSLARisk(riskRes.data);
      }

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to load order details")
      );

    } finally {

      OrdersState.setLoading("thread", false);
    }
  },

  /* =====================================================
     UPDATE STATUS (TRANSITION SAFE)
  ===================================================== */
  async updateStatus(newStatus) {

    const poId = OrdersState.selectedOrderId;
    if (!poId) return;

    try {

      OrdersState.setOptimisticStatus(true);

      const res = await OrdersApi.updateStatus(
        poId,
        newStatus
      );

      if (!res.success) {
        throw new Error(res.message || "Status update failed");
      }

      Toast.success("Status updated successfully");

      await this.loadThread(poId);
      await this.bootstrap();

    } catch (err) {

      Toast.error(
        normalizeError(err, "Status update failed")
      );

    } finally {

      OrdersState.setOptimisticStatus(false);
    }
  },

  /* =====================================================
     COMPLETE MILESTONE
  ===================================================== */
  async completeMilestone(payload) {

    const poId = OrdersState.selectedOrderId;
    if (!poId) return;

    try {

      OrdersState.setOptimisticMilestone(payload.milestoneName);

      const res = await OrdersApi.completeMilestone(
        poId,
        payload
      );

      if (!res.success) {
        throw new Error(res.message || "Milestone failed");
      }

      Toast.success("Milestone completed");

      await this.loadThread(poId);
      await this.bootstrap();

    } catch (err) {

      Toast.error(
        normalizeError(err, "Milestone completion failed")
      );

    } finally {

      OrdersState.clearOptimistic();
    }
  },

  /* =====================================================
     SEND MESSAGE
  ===================================================== */
  async sendMessage(message) {

    const poId = OrdersState.selectedOrderId;
    if (!poId) return;

    try {

      OrdersState.optimistic.sendingMessage = true;

      const res = await OrdersApi.sendMessage(
        poId,
        message
      );

      if (!res.success) {
        throw new Error(res.message || "Message failed");
      }

      await this.loadThread(poId);

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to send message")
      );

    } finally {

      OrdersState.optimistic.sendingMessage = false;
    }
  },

  /* =====================================================
     CONFIRM PAYMENT
  ===================================================== */
  async confirmPayment(amount) {

    const poId = OrdersState.selectedOrderId;
    if (!poId) return;

    try {

      OrdersState.setLoading("action", true);

      const res = await OrdersApi.confirmPayment(
        poId,
        amount
      );

      if (!res.success) {
        throw new Error(res.message || "Payment failed");
      }

      Toast.success("Payment confirmed");

      await this.loadThread(poId);
      await this.bootstrap();

    } catch (err) {

      Toast.error(
        normalizeError(err, "Payment confirmation failed")
      );

    } finally {

      OrdersState.setLoading("action", false);
    }
  },

  /* =====================================================
     RAISE DISPUTE
  ===================================================== */
  async raiseDispute(reason) {

    const poId = OrdersState.selectedOrderId;
    if (!poId) return;

    try {

      OrdersState.setLoading("action", true);

      const res = await OrdersApi.raiseDispute(
        poId,
        reason
      );

      if (!res.success) {
        throw new Error(res.message || "Dispute failed");
      }

      Toast.success("Dispute raised successfully");

      await this.loadThread(poId);
      await this.bootstrap();

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to raise dispute")
      );

    } finally {

      OrdersState.setLoading("action", false);
    }
  },

  /* =====================================================
     LOAD SLA DASHBOARD ONLY
  ===================================================== */
  async refreshSLADashboard() {

    try {

      OrdersState.setLoading("slaDashboard", true);

      const res = await OrdersApi.getSLADashboard();

      if (res.success) {
        OrdersState.setSLADashboard(res.data);
      }

    } catch {
      // silent
    } finally {
      OrdersState.setLoading("slaDashboard", false);
    }
  },

  /* =====================================================
     LOAD PDF DATA
  ===================================================== */
  async loadPDFData() {

    const poId = OrdersState.selectedOrderId;
    if (!poId) return null;

    try {

      const res = await OrdersApi.getPDFData(poId);

      if (!res.success) {
        throw new Error(res.message || "PDF load failed");
      }

      return res.data;

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to generate PDF")
      );

      return null;
    }
  },

  /* =====================================================
     CLEANUP (ROUTE SAFE)
  ===================================================== */
  cleanup() {
    OrdersApi.cancelAll();
    OrdersState.reset();
  }

};