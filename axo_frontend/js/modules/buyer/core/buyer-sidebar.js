/* =========================================================
   AXO NETWORKS — BUYER SIDEBAR (PRODUCTION READY)
   - History API routing
   - Active state via pathname
   - Desktop collapse
   - Mobile slide-in
   - Persistent state
   - Memory safe listeners
========================================================= */

const STORAGE_KEY = "axo_sidebar_collapsed";

const menuItems = [
  { label: "Dashboard", icon: "layout-dashboard", route: "/buyer/dashboard" },
  { label: "Orders", icon: "shopping-cart", route: "/buyer/orders" },
  { label: "RFQs", icon: "file-text", route: "/buyer/rfqs" },
  { label: "Payments", icon: "credit-card", route: "/buyer/payments" }
];

/* =========================================================
   RENDER SIDEBAR
========================================================= */

export function renderBuyerSidebar() {
  return `
    <div class="sidebar-container">

      <!-- Logo -->
      <div class="sidebar-logo">
        <i data-lucide="factory"></i>
        <span class="logo-text">AXO Buyer</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        ${menuItems.map(item => `
          <a href="${item.route}"
             class="sidebar-link"
             data-route="${item.route}">
            <i data-lucide="${item.icon}"></i>
            <span class="link-text">${item.label}</span>
          </a>
        `).join("")}
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button id="sidebarCollapseBtn" class="collapse-btn">
          <i data-lucide="panel-left"></i>
          <span class="link-text">Collapse</span>
        </button>
      </div>

    </div>
  `;
}

/* =========================================================
   ACTIVE LINK (History API Version)
========================================================= */

export function updateActiveSidebarLink() {
  const links = document.querySelectorAll(".sidebar-link");
  const currentPath = window.location.pathname;

  links.forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.route === currentPath
    );
  });
}

/* =========================================================
   TOGGLE LOGIC (Memory Safe)
========================================================= */

let outsideClickHandler = null;

export function initSidebarToggle() {

  const layout = document.getElementById("buyerApp");
  const sidebar = document.getElementById("buyerSidebar");
  const collapseBtn = document.getElementById("sidebarCollapseBtn");
  const menuToggle = document.getElementById("menuToggle");

  if (!layout || !sidebar || !collapseBtn) return;

  /* ------------------------------
     Restore persisted state
  ------------------------------ */
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState === "true") {
    layout.classList.add("collapsed");
  }

  /* ------------------------------
     Desktop Collapse Toggle
  ------------------------------ */
  collapseBtn.addEventListener("click", () => {
    layout.classList.toggle("collapsed");

    const isCollapsed = layout.classList.contains("collapsed");
    localStorage.setItem(STORAGE_KEY, isCollapsed);
  });

  /* ------------------------------
     Mobile Slide Toggle
  ------------------------------ */
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  /* ------------------------------
     Click Outside Close (Mobile)
  ------------------------------ */

  outsideClickHandler = (e) => {

    if (window.innerWidth > 1024) return;

    if (
      !sidebar.contains(e.target) &&
      !menuToggle?.contains(e.target)
    ) {
      sidebar.classList.remove("open");
    }
  };

  document.addEventListener("click", outsideClickHandler);
}

/* =========================================================
   CLEANUP (Future Safe)
========================================================= */

export function cleanupSidebar() {
  if (outsideClickHandler) {
    document.removeEventListener("click", outsideClickHandler);
    outsideClickHandler = null;
  }
}