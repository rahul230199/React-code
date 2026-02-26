/* =========================================================
   AXO NETWORKS — CENTRAL API CLIENT (ENTERPRISE HARDENED)
   - AbortController timeout
   - Proper 401 handling
   - Flexible headers
   - Clean error propagation
========================================================= */

import { CONFIG } from "./config.js";
import { StorageManager as Storage } from "./storage.js";

const { API_BASE_URL, REQUEST_TIMEOUT } = CONFIG;

/* =======================================================
   CORE REQUEST HANDLER
======================================================= */
async function request(
  endpoint,
  method = "GET",
  body = null,
  customHeaders = {}
) {

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT
  );

  const token = Storage.getToken();

  const headers = {
    ...customHeaders,
  };

  // Only set JSON content-type if body is plain object
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body) {
    options.body =
      body instanceof FormData
        ? body
        : JSON.stringify(body);
  }

  let response;

  try {

    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      options
    );

  } catch (error) {

    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }

    throw new Error(
      error?.message || "Network connection error"
    );
  }

  clearTimeout(timeoutId);

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  /* ===================================================
     GLOBAL AUTH HANDLER
  =================================================== */
  if (response.status === 401) {

    Storage.clearSession();
    window.location.href = "/login";

    throw new Error("Session expired");
  }

  /* ===================================================
     ERROR NORMALIZATION
  =================================================== */
  if (!response.ok) {

    const message =
      data?.message ||
      `Request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;
    error.errorCode = data?.errorCode || null;

    throw error;
  }

  return data;
}

/* =======================================================
   PUBLIC API METHODS
======================================================= */
export const ApiClient = {

  get(endpoint) {
    return request(endpoint, "GET");
  },

  post(endpoint, body) {
    return request(endpoint, "POST", body);
  },

  patch(endpoint, body) {
    return request(endpoint, "PATCH", body);
  },

  put(endpoint, body) {
    return request(endpoint, "PUT", body);
  },

  delete(endpoint) {
    return request(endpoint, "DELETE");
  }

};

export default ApiClient;