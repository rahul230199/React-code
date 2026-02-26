/* =========================================================
   AXO NETWORKS — DASHBOARD STATE (PRODUCTION HARDENED)
   Immutable | Defensive | Performant
========================================================= */

export const DashboardState = (() => {

  /* ======================================================
     PRIVATE STATE
  ====================================================== */

  let _loading = false;
  let _data = null;
  let _error = null;

  /* ======================================================
     HELPERS
  ====================================================== */

  function shallowClone(obj) {
    return obj && typeof obj === "object"
      ? { ...obj }
      : null;
  }

  function freezeData(data) {
    if (!data || typeof data !== "object") return null;

    return Object.freeze({ ...data });
  }

  /* ======================================================
     LOADING
  ====================================================== */

  function setLoading(value) {
    _loading = Boolean(value);
  }

  function isLoading() {
    return _loading;
  }

  /* ======================================================
     DATA
  ====================================================== */

  function setData(data) {

    if (!data || typeof data !== "object") {
      _data = null;
      return;
    }

    _data = freezeData(data);
  }

  function getData() {
    return shallowClone(_data);
  }

  /* ======================================================
     ERROR
  ====================================================== */

  function setError(error) {

    if (!error) {
      _error = null;
      return;
    }

    _error = {
      message: error.message || "Unknown error",
      code: error.code || null
    };
  }

  function getError() {
    return _error ? { ..._error } : null;
  }

  /* ======================================================
     RESET
  ====================================================== */

  function reset() {
    _loading = false;
    _data = null;
    _error = null;
  }

  /* ======================================================
     PUBLIC API
  ====================================================== */

  return Object.freeze({
    setLoading,
    isLoading,
    setData,
    getData,
    setError,
    getError,
    reset
  });

})();

export default DashboardState;