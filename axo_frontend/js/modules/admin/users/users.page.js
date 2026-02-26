/* =========================================================
   AXO NETWORKS — USERS PAGE ORCHESTRATOR
   Enterprise • Lifecycle Safe • SPA Hardened
========================================================= */

import { UsersEvents } from "./users.events.js";
import { UsersState } from "./users.state.js";
import { UsersRender } from "./users.render.js";

export const UsersPage = {

  container: null,
  isInitialized: false,
  mountId: null,

  /* =====================================================
     INIT
  ===================================================== */
  async init() {

    const container = document.getElementById("contentArea");
    if (!container) return;

    // Prevent double mount
    if (this.isInitialized && this.container === container) {
      return;
    }

    // Generate mount token (prevents stale async)
    const currentMount = Date.now();
    this.mountId = currentMount;

    this.container = container;
    this.isInitialized = true;

    /* Reset state cleanly */
    UsersState.reset();

    /* Initial render (empty skeleton state) */
    UsersRender.render(container, UsersState.get());

    /* Bind event layer */
    UsersEvents.bind(container);

    /* Load data safely */
    try {
      await UsersEvents.reload();

      // If page was destroyed during async
      if (this.mountId !== currentMount) return;

    } catch (err) {
      console.error("UsersPage init failed:", err);
    }
  },

  /* =====================================================
     DESTROY (FULL CLEANUP)
  ===================================================== */
  destroy() {

    if (!this.isInitialized) return;

    /* Invalidate mount */
    this.mountId = null;

    /* Destroy event layer */
    UsersEvents.destroy();

    /* Reset state */
    UsersState.reset();

    /* Clear DOM safely */
    if (this.container) {
      this.container.innerHTML = "";
    }

    /* Clear references */
    this.container = null;
    this.isInitialized = false;
  }
  

};

export default UsersPage;