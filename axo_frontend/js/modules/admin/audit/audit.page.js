/* =========================================================
   AXO NETWORKS — AUDIT PAGE ORCHESTRATOR (PRODUCTION HARDENED)
   Lifecycle Safe | Async Guarded | Memory Clean
========================================================= */

import { AuditEvents } from "./audit.events.js";
import { AuditRender } from "./audit.render.js";
import { AuditState } from "./audit.state.js";

export const AuditPage = (() => {

  let _container = null;
  let _mounted = false;
  let _instanceId = 0;

  /* ====================================================== */

  async function init(container) {

    if (!container) return;

    destroy(); // Prevent double mount

    _container = container;
    _mounted = true;

    const currentInstance = ++_instanceId;

    AuditState.reset();

    // Inject layout
    _container.innerHTML = AuditRender.layout();

    // Bind events
    AuditEvents.bind(_container, {
      onRender: render
    });

    render();

    try {
      await AuditEvents.load();

      // Prevent stale async continuation
      if (!_mounted || currentInstance !== _instanceId) return;

    } catch (err) {
      console.error("AuditPage load error:", err);
    }
  }

  /* ====================================================== */

  function render() {

    if (!_mounted || !_container) return;

    AuditRender.renderAll(_container, {
      logs: AuditState.getLogs(),
      pagination: AuditState.getPagination(),
      loading: AuditState.isLoading(),
      error: AuditState.getError()
    });
  }

  /* ====================================================== */

  function destroy() {

    if (!_mounted) return;

    AuditEvents.unbind();

    if (_container) {
      _container.innerHTML = "";
    }

    _mounted = false;
    _container = null;
    _instanceId++;
  }

  return {
    init,
    destroy
  };

})();

export default AuditPage;