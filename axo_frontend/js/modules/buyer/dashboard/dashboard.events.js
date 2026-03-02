/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD EVENTS
   Production Safe
   - Auto refresh
   - Silent background update
   - Memory safe intervals
   - No layout rebuild
========================================================= */

import { loadDashboardData } from "./dashboard.api.js";
import { renderDashboard } from "./dashboard.render.js";
import { initializeCharts } from "./dashboard.charts.js";
import { DashboardState } from "./dashboard.state.js";

let refreshInterval = null;
const REFRESH_TIME = 60000; // 60 seconds

/* =========================================================
   SILENT REFRESH
========================================================= */

async function silentRefresh() {

  try {
    const data = await loadDashboardData();
    if (!data || !data.summary) return;

    // Update state
    DashboardState.set(data);

    // Re-render only data (not layout)
    renderDashboard(data);

    // Update charts safely
    initializeCharts(data);

  } catch {
    // Silent fail
  }
}

/* =========================================================
   START AUTO REFRESH
========================================================= */

export function startDashboardAutoRefresh() {

  stopDashboardAutoRefresh(); // prevent duplicate intervals

  refreshInterval = setInterval(() => {
    silentRefresh();
  }, REFRESH_TIME);
}

/* =========================================================
   STOP AUTO REFRESH
========================================================= */

export function stopDashboardAutoRefresh() {

  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/* =========================================================
   PAGE VISIBILITY OPTIMIZATION
   Pause refresh when tab inactive
========================================================= */

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {
    stopDashboardAutoRefresh();
  } else {
    startDashboardAutoRefresh();
  }
});