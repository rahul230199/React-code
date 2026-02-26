/* =========================================================
   AXO NETWORKS — SYSTEM PAGE
   Enterprise Orchestration Layer (Premium Safe)
   - Lifecycle safe
   - Re-init protected
   - Async guarded
   - Clean destroy
   - Chart + Interval safe
========================================================= */

import { SystemEvents } from "./system.events.js";
import { SystemState } from "./system.state.js";
import { SystemRender } from "./system.render.js";

export const SystemPage = {

  container: null,
  isInitialized: false,
  initToken: 0,

  /* ------------------------------------------------------
     INIT
  ------------------------------------------------------ */
  async init() {

    const container = document.getElementById("contentArea");
    if (!container) return;

    // If already initialized → destroy first (safe re-enter)
    if (this.isInitialized) {
      this.destroy();
    }

    this.container = container;
    this.isInitialized = true;

    const currentToken = ++this.initToken;

    // Reset state
    SystemState.reset();

    // Initial skeleton render
    SystemRender.render(container, SystemState.get());

    // Bind events (safe single bind inside SystemEvents)
    SystemEvents.bind(container);

    try {

      // Initial load
      await SystemEvents.load();

      // If page changed while loading → abort
      if (currentToken !== this.initToken) return;

    } catch (err) {
      console.error("SystemPage init error:", err);
    }
  },

  /* ------------------------------------------------------
     DESTROY
  ------------------------------------------------------ */
  destroy() {

    if (!this.isInitialized) return;

    // Destroy events (intervals, charts, listeners)
    SystemEvents.destroy();

    // Reset state
    SystemState.reset();

    // Clear DOM safely
    if (this.container) {
      this.container.innerHTML = "";
    }

    this.container = null;
    this.isInitialized = false;

    // Invalidate pending async calls
    this.initToken++;
  }

};

export default SystemPage;