/* =========================================================
   AXO NETWORKS — FRONTEND CONFIG
   Enterprise Environment Configuration
   ES Module Version (No Global Pollution)
========================================================= */

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const CONFIG = {
  API_BASE_URL: isLocal
    ? "http://localhost:5000/api"
    : "https://www.axonetworks.com/api",

  TOKEN_KEY: "axo_access_token",
  USER_KEY: "axo_user",

  APP_NAME: "AXO Networks",
  VERSION: "1.0.0",

  REQUEST_TIMEOUT: 15000, // 15 seconds
};

export default CONFIG;