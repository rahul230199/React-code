/* =========================================================
AXO NETWORKS — ADMIN ORDERS API
Backend Connector
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

const BASE = "/admin/orders";

/* =========================================================
FETCH ORDERS
GET /admin/orders
========================================================= */

export async function fetchOrders(params = {}) {

  const query = new URLSearchParams(params).toString();

  const res = await ApiClient.get(`${BASE}?${query}`);

  if (!res?.success) {
    throw new Error(res?.message || "Failed to fetch orders");
  }

  return res.data;

}

/* =========================================================
FETCH ORDER DETAILS
GET /admin/orders/:poId
========================================================= */

export async function fetchOrderDetails(poId) {

  if (!poId) {
    throw new Error("Invalid PO ID");
  }

  const res = await ApiClient.get(`${BASE}/${poId}`);

  if (!res?.success) {
    throw new Error(res?.message || "Failed to load order");
  }

  return res.data;

}

/* =========================================================
SEND MESSAGE
POST /admin/orders/:poId/messages
========================================================= */

export async function sendOrderMessage(poId, message) {

  if (!poId || !message) {
    throw new Error("Invalid message");
  }

  const res = await ApiClient.post(
    `/po-thread/${poId}/messages`,
    { message }
  );

  if (!res?.success) {
    throw new Error(res?.message || "Message failed");
  }

  return res.data;

}