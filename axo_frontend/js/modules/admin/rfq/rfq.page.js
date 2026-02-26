/* =========================================================
   AXO NETWORKS — ADMIN RFQ PAGE
   Enterprise Orchestration Layer
   Lifecycle Safe • Race Safe • Memory Safe
========================================================= */

import { RFQState } from "./rfq.state.js";
import { RFQRender } from "./rfq.render.js";
import { RFQEvents } from "./rfq.events.js";

export const RFQPage = (() => {

  let _container = null;
  let _mounted = false;
  let _initToken = 0;

  /* ======================================================
     INIT
  ====================================================== */

  async function init(container) {

    if (!container ||
        !(container instanceof HTMLElement)) {
      return;
    }

    // Prevent double mount
    destroy();

    const currentInit = ++_initToken;

    _container = container;
    _mounted = true;

    // Reset state
    RFQState.reset();

    try {

      /* ---------- Inject Layout ---------- */
      _container.innerHTML =
        RFQRender.layout();

      /* ---------- Bind Events ---------- */
      RFQEvents.bind(_container, {
        onRender: handleEvent
      });

      /* ---------- Initial Render ---------- */
      render();

      /* ---------- Load Data ---------- */
      await RFQEvents.load();

      // If destroyed during async load, stop
      if (!_mounted ||
          currentInit !== _initToken) {
        return;
      }

    } catch (error) {

      if (!_mounted) return;

      console.error(
        "RFQPage initialization failed:",
        error
      );

      _container.innerHTML = `
        <div class="error-state">
          <h3>Failed to initialize RFQ module</h3>
        </div>
      `;
    }
  }

  /* ======================================================
     EVENT ROUTING
  ====================================================== */

  function handleEvent(event) {

    if (!_mounted) return;

    if (!event ||
        event.type === "update") {
      render();
    }
  }

  /* ======================================================
     RENDER
  ====================================================== */

  function render() {

    if (!_mounted ||
        !_container) {
      return;
    }

    try {

      RFQRender.renderAll(
        _container,
        {
          rfqs: RFQState.getRFQs(),
          loading: RFQState.isLoading(),
          pagination: RFQState.getPagination(),
          error: RFQState.getError(),
          filters: RFQState.getFilters()
        }
      );

    } catch (error) {

      console.error(
        "RFQPage render error:",
        error
      );
    }
  }

  /* ======================================================
     DESTROY
  ====================================================== */

  function destroy() {

    if (!_mounted) return;

    // Unbind events first (prevents async callbacks)
    RFQEvents.unbind();

    // Reset state (prevent stale memory)
    RFQState.reset();

    // Clear DOM safely
    if (_container) {
      _container.innerHTML = "";
    }

    _mounted = false;
    _container = null;
  }

  /* ======================================================
     PUBLIC API
  ====================================================== */

  return {
    init,
    destroy
  };

})();

export default RFQPage;