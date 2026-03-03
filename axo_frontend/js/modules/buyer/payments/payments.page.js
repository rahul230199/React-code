const containerId = "pageContainer";

export async function loadPaymentsPage() {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="buyer-payments route-transition">
      <div class="page-header">
        <h1>Payments</h1>
        <p class="subtitle">Track and manage outgoing payments</p>
      </div>

      <div class="payments-placeholder">
        <p>Payments page loaded successfully.</p>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const page = container.querySelector(".buyer-payments");
    if (page) page.classList.add("route-transition");
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
