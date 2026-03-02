/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD STATE
   Production Safe
   - Centralized state
   - Immutable updates
   - Re-render safe
   - Refresh aware
========================================================= */

class DashboardStateManager {

  constructor() {
    this._data = null;
    this._lastUpdated = null;
  }

  /* -------------------------------------------------------
     SET STATE
  ------------------------------------------------------- */
  set(data) {
    if (!data) return;

    this._data = Object.freeze({ ...data });
    this._lastUpdated = Date.now();
  }

  /* -------------------------------------------------------
     GET FULL STATE
  ------------------------------------------------------- */
  get() {
    return this._data;
  }

  /* -------------------------------------------------------
     GET LAST UPDATED TIMESTAMP
  ------------------------------------------------------- */
  getLastUpdated() {
    return this._lastUpdated;
  }

  /* -------------------------------------------------------
     CHECK IF STATE EXISTS
  ------------------------------------------------------- */
  hasData() {
    return !!this._data;
  }

  /* -------------------------------------------------------
     CLEAR STATE (for logout / tenant switch)
  ------------------------------------------------------- */
  clear() {
    this._data = null;
    this._lastUpdated = null;
  }

  /* -------------------------------------------------------
     GET SPECIFIC SECTION
     Example: getSection("summary")
  ------------------------------------------------------- */
  getSection(key) {
    return this._data?.[key] || null;
  }
}

/* =========================================================
   SINGLETON EXPORT
========================================================= */

export const DashboardState = new DashboardStateManager();