/* =========================================================
   AXO NETWORKS — SYSTEM STATE
   Immutable | Deterministic | Enterprise Safe
========================================================= */

const createInitialState = () => ({
  metrics: null,
  loading: false,
  error: null,
  lastUpdatedAt: null,

  autoRefreshEnabled: false,
  refreshIntervalMs: 60000
});

export const SystemState = {

  _state: createInitialState(),

  /* ------------------------------------------------------
     RESET
  ------------------------------------------------------ */
  reset() {
    this._state = createInitialState();
  },

  /* ------------------------------------------------------
     SAFE SNAPSHOT (FROZEN)
  ------------------------------------------------------ */
  get() {
    return Object.freeze({ ...this._state });
  },

  /* ------------------------------------------------------
     GENERIC SET (Defensive Merge)
  ------------------------------------------------------ */
  set(patch = {}) {

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return;
    }

    this._state = Object.freeze({
      ...this._state,
      ...patch
    });
  },

  /* ------------------------------------------------------
     SET METRICS (Normalized + Safe)
  ------------------------------------------------------ */
  setMetrics(data) {

    const safeMetrics =
      data && typeof data === "object"
        ? { ...data }
        : null;

    this._state = Object.freeze({
      ...this._state,
      metrics: safeMetrics,
      lastUpdatedAt: new Date().toISOString(),
      error: null
    });
  },

  /* ------------------------------------------------------
     SET LOADING
  ------------------------------------------------------ */
  setLoading(value) {

    this._state = Object.freeze({
      ...this._state,
      loading: Boolean(value)
    });
  },

  /* ------------------------------------------------------
     SET ERROR
  ------------------------------------------------------ */
  setError(message) {

    this._state = Object.freeze({
      ...this._state,
      error: message || null,
      loading: false
    });
  },

  /* ------------------------------------------------------
     AUTO REFRESH TOGGLE
  ------------------------------------------------------ */
  setAutoRefresh(enabled) {

    this._state = Object.freeze({
      ...this._state,
      autoRefreshEnabled: Boolean(enabled)
    });
  }

};

export default SystemState;