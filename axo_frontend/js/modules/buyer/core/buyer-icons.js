/* =========================================================
   AXO NETWORKS — BUYER ICON SYSTEM
   Production Safe Lucide Wrapper
   - Re-render safe
   - Route safe
   - Silent fail
========================================================= */

/* =========================================================
   INITIALIZE LUCIDE ICONS
========================================================= */

export function initializeLucide() {

  if (!window.lucide || typeof window.lucide.createIcons !== "function") {
    return;
  }

  try {
    window.lucide.createIcons();
  } catch {
    // Silent fail — never break UI
  }
}

/* =========================================================
   RE-RENDER ICONS AFTER DOM UPDATE
========================================================= */

export function refreshLucideIcons() {
  initializeLucide();
}