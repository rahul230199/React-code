/* =========================================================
   AXO NETWORKS — CENTRAL API CLIENT (PRODUCTION SAFE)
   - No console logging
   - Standardized error handling
   - Safe JSON parsing
   - Clean auth redirect
========================================================= */

import { CONFIG } from "./config.js";
import { StorageManager as Storage } from "./storage.js";

const { API_BASE_URL, REQUEST_TIMEOUT } = CONFIG;

/* =======================================================
   FETCH WITH TIMEOUT
======================================================= */
function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, timeout);

    fetch(url, options)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/* =======================================================
   SAFE JSON PARSER
======================================================= */
async function safeParseJSON(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/* =======================================================
   CORE REQUEST HANDLER
======================================================= */
async function request(endpoint, method = "GET", body = null, customHeaders = {}) {

  const token = Storage.getToken();

  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;

  try {

    response = await fetchWithTimeout(
      `${API_BASE_URL}${endpoint}`,
      options
    );

  } catch (networkError) {

    throw new Error("Network connection error");
  }

  const data = await safeParseJSON(response);

  /* ===================================================
     GLOBAL AUTH HANDLER
  =================================================== */
  if (response.status === 401) {
    Storage.clearSession();
    window.location.href = "/login";
    return;
  }

  /* ===================================================
     ERROR NORMALIZATION
  =================================================== */
  if (!response.ok) {

    const message =
      data?.message ||
      "Request failed";

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