/* =========================================================
   AXO NETWORKS — DASHBOARD PAGE ORCHESTRATOR (PRODUCTION HARDENED)
   Instance Safe • Async Guarded • Memory Clean
========================================================= */

import { DashboardAPI } from "./dashboard.api.js";
import { DashboardState } from "./dashboard.state.js";
import { DashboardRender } from "./dashboard.render.js";
import { DashboardEvents } from "./dashboard.events.js";
import Toast from "../../../core/toast.js";

export const DashboardPage = (() => {

  let _container = null;
  let _mounted = false;
  let _requestId = 0;
  let _instanceId = 0;

  /* ====================================================== */

  async function init(container) {

    if (!container || !(container instanceof HTMLElement)) return;

    destroy(); // Prevent double mount

    _container = container;
    _mounted = true;

    const currentInstance = ++_instanceId;

    DashboardState.reset();

    _container.innerHTML = DashboardRender.layout();

    DashboardEvents.bind(_container, {
      onReload: load
    });

    render();

    try {
      await load();

      if (!_mounted || currentInstance !== _instanceId) return;

    } catch (err) {
      console.error("DashboardPage init load error:", err);
    }
  }

  /* ====================================================== */

  async function load() {

    if (!_mounted) return;

    const currentRequest = ++_requestId;

    try {

      DashboardState.setLoading(true);
      render();

      const data = await DashboardAPI.getOverview();

      if (!_mounted || currentRequest !== _requestId) return;

      DashboardState.setData(data);
      DashboardState.setError(null);

    } catch (error) {

      if (!_mounted || currentRequest !== _requestId) return;

      DashboardState.setError(error);
      Toast.error("Failed to load dashboard overview");

    } finally {

      if (!_mounted || currentRequest !== _requestId) return;

      DashboardState.setLoading(false);
      render();
    }
  }

  /* ====================================================== */

  function render() {

    if (!_mounted || !_container) return;

    DashboardRender.renderAll(_container, {
      data: DashboardState.getData(),
      loading: DashboardState.isLoading(),
      error: DashboardState.getError()
    });
  }

  /* ====================================================== */

  function destroy() {

    if (!_mounted) return;

    DashboardEvents.unbind();

    if (_container) {
      _container.innerHTML = "";
    }

    _mounted = false;
    _container = null;

    _requestId++;
    _instanceId++;
  }

  /* ====================================================== */

  return Object.freeze({
    init,
    load,
    destroy
  });

})();

export default DashboardPage;