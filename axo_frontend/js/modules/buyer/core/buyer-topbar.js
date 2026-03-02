/* =========================================================
   AXO NETWORKS — BUYER TOPBAR
   Premium SaaS UI (Vanilla + UMD Safe)
========================================================= */

import { AuthManager } from "../../../core/authManager.js";
import { openNotificationPanel } from "../notifications/notifications.panel.js";

let dropdownOpen = false;
let outsideClickHandler = null;

/* =========================================================
   RENDER TOPBAR
========================================================= */

export function renderBuyerTopbar() {
  return `
    <div class="topbar-container">

      <div class="topbar-left">
        <button id="menuToggle" class="menu-toggle">
          <i data-lucide="menu"></i>
        </button>
        <h2 id="pageTitle">Dashboard</h2>
      </div>

      <div class="topbar-right">

        <div class="topbar-icon" id="notificationButton">
          <i data-lucide="bell"></i>
          <span id="notificationBadge" class="badge hidden"></span>
        </div>

        <div class="topbar-user" id="userMenuButton">
          <div class="avatar">
            <i data-lucide="user"></i>
          </div>
          <i data-lucide="chevron-down" class="chevron"></i>
        </div>

        <div class="user-dropdown hidden" id="userDropdown">
          <div class="dropdown-item" id="logoutButton">
            <i data-lucide="log-out"></i>
            <span>Logout</span>
          </div>
        </div>

      </div>
    </div>
  `;
}

/* =========================================================
   INIT EVENTS
========================================================= */

export function initTopbarEvents() {

  // Render Lucide icons (UMD safe)
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const userMenuBtn = document.getElementById("userMenuButton");
  const dropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutButton");
  const notificationBtn = document.getElementById("notificationButton");
  const menuToggle = document.getElementById("menuToggle");

  if (notificationBtn) {
    notificationBtn.onclick = () => {
      openNotificationPanel();
    };
  }

  if (menuToggle) {
    menuToggle.onclick = () => {
      document.body.classList.toggle("sidebar-collapsed");
    };
  }

  if (userMenuBtn && dropdown) {

    userMenuBtn.onclick = () => {
      dropdownOpen = !dropdownOpen;
      dropdown.classList.toggle("hidden", !dropdownOpen);
    };

    outsideClickHandler = (e) => {
      if (
        !userMenuBtn.contains(e.target) &&
        !dropdown.contains(e.target)
      ) {
        dropdown.classList.add("hidden");
        dropdownOpen = false;
      }
    };

    document.addEventListener("click", outsideClickHandler);
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      AuthManager.logout();
    };
  }
}

/* =========================================================
   CLEANUP
========================================================= */

export function cleanupTopbar() {
  if (outsideClickHandler) {
    document.removeEventListener("click", outsideClickHandler);
    outsideClickHandler = null;
  }
  dropdownOpen = false;
}

/* =========================================================
   PAGE TITLE
========================================================= */

export function setPageTitle(title) {
  const el = document.getElementById("pageTitle");
  if (el) el.textContent = title;
}

/* =========================================================
   NOTIFICATION BADGE
========================================================= */

export function updateNotificationBadge(count) {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}