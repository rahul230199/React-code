/* =========================================================
   AXO NETWORKS — STORAGE MANAGER
   Enterprise Session Handling Layer
   ES Module Version (No Global Pollution)
========================================================= */

import { CONFIG } from "./config.js";

const TOKEN_KEY = CONFIG.TOKEN_KEY;
const USER_KEY = CONFIG.USER_KEY;

export const StorageManager = {
  /* ===============================
     TOKEN MANAGEMENT
  =============================== */

  setToken(token) {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  /* ===============================
     USER MANAGEMENT
  =============================== */

  setUser(user) {
    if (!user) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  removeUser() {
    localStorage.removeItem(USER_KEY);
  },

  /* ===============================
     SESSION CONTROL
  =============================== */

  clearSession() {
    this.removeToken();
    this.removeUser();
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export default StorageManager;