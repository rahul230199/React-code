(function () {
  const TOKEN_KEY = 'axo_auth_token';

  const API = {
    me: '/api/auth/me',
    overview: '/api/dashboard/overview'
  };

  /* ================= AUTH ================= */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function logout() {
    localStorage.clear();
    window.location.replace('/login');
  }

  if (!getToken()) {
    logout();
    return;
  }

  /* ================= ELEMENTS ================= */
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const navItems = document.querySelectorAll('.nav-item');
  const themeToggle = document.getElementById('themeToggle');

  const dashboards = {
    manufacturer: document.getElementById('manufacturerDashboard'),
    buyer: document.getElementById('buyerDashboard'),
    seller: document.getElementById('sellerDashboard'),
    services: document.getElementById('servicesDashboard')
  };

  const userNameEl = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const activityBody = document.getElementById('activityLogsTbody');
  const emptyState = document.querySelector('.empty-state');

  /* ================= SIDEBAR ================= */
/* ================= SIDEBAR STATE ================= */


let collapsed = localStorage.getItem('axo_sidebar') === '1';

function applySidebar() {
  if (window.innerWidth <= 768) {
    sidebar.style.left = collapsed ? '-100%' : '0';
    sidebar.classList.remove('collapsed');
  } else {
    sidebar.style.left = '0';
    sidebar.classList.toggle('collapsed', collapsed);
  }

  localStorage.setItem('axo_sidebar', collapsed ? '1' : '0');
}

sidebarToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  collapsed = !collapsed;
  applySidebar();
});

window.addEventListener('resize', applySidebar);

document.addEventListener('click', (e) => {
  if (
    window.innerWidth <= 768 &&
    !sidebar.contains(e.target) &&
    !sidebarToggle.contains(e.target)
  ) {
    collapsed = true;
    applySidebar();
  }
});



/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', applySidebar);


  /* ================= VIEW SWITCH ================= */
  function setActiveView(view) {
    navItems.forEach(btn =>
      btn.classList.toggle('active', btn.dataset.view === view)
    );

    Object.entries(dashboards).forEach(([key, el]) => {
      if (el) el.style.display = key === view ? 'block' : 'none';
    });
  }
  navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view) {
      setActiveView(view);
    }
  });
});

  /* ================= USER ================= */
  async function loadUser() {
    const res = await fetch(API.me, { headers: authHeaders() });
    if (!res.ok) return logout();
    const user = await res.json();
    userNameEl.textContent = `Hi, ${user.name || 'User'}`;
  }

  /* ================= DASHBOARD DATA ================= */
  async function loadDashboard() {
    const res = await fetch(API.overview, { headers: authHeaders() });
    if (!res.ok) return;

    const data = await res.json();

    renderManufacturer(data.manufacturer);
    renderManufacturerChart(data.manufacturer);
    renderBuyer(data.buyer);
    renderBuyerServices(data.buyer?.services || []);
    renderSeller(data.seller);
    renderSellerServices(data.seller?.services || []);
    renderActivityLogs(data.activity_logs);
  }

  /* ================= RENDERERS ================= */
  function renderManufacturer(m = {}) {
    setText('executionScore', m.execution_score || 0);
    setText('timelineAdherence', m.timeline_adherence || 0);
    setText('supplierReliability', m.supplier_reliability || 0);
    setText('qualityConsistency', m.quality_consistency || 0);
  }

  let manufacturerChart;
  function renderManufacturerChart(m = {}) {
    const ctx = document.getElementById('manufacturerChart');
    if (!ctx) return;

    manufacturerChart?.destroy();

    manufacturerChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Execution', 'Timeline', 'Supplier', 'Quality'],
        datasets: [{
          label: 'Manufacturer Metrics',
          data: [
            m.execution_score || 0,
            m.timeline_adherence || 0,
            m.supplier_reliability || 0,
            m.quality_consistency || 0
          ],
          backgroundColor: ['#4f46e5', '#22c55e', '#06b6d4', '#f59e0b']
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  function renderBuyer(b = {}) {
    setText('uploadedRequirements', b.requirements || 0);
    setText('designStatus', `${b.design_completed || 0} Completed`);
    setText('matchingStatus', `${b.matched || 0} Matched`);
  }

  function renderSeller(s = {}) {
    setText('activeRFQs', s.active_rfqs || 0);
    setText('programsMatched', s.programs_matched || 0);
    setText('quotationStatus', s.quotation_status || 0);
  }

  function renderBuyerServices(services) {
    const el = document.getElementById('buyerServices');
    el.innerHTML = services.length
      ? services.map(s => `<span class="service-chip">${s.name}</span>`).join('')
      : '<p>No services linked</p>';
  }

  function renderSellerServices(services) {
    const el = document.getElementById('sellerServices');
    el.innerHTML = services.length
      ? services.map(s => `<span class="service-chip">${s.name}</span>`).join('')
      : '<p>No services added</p>';
  }

  function renderActivityLogs(logs = []) {
    activityBody.innerHTML = '';
    emptyState.style.display = logs.length ? 'none' : 'block';

    logs.forEach(log => {
      activityBody.innerHTML += `
        <tr>
          <td>${new Date(log.created_at).toLocaleDateString()}</td>
          <td>You</td>
          <td>${log.action}</td>
          <td>${log.status}</td>
        </tr>`;
    });
  }
  function renderOrderTimeline(order) {
  const container = document.getElementById('manufacturerDashboard');

  const steps = [
    'ORDER_PLACED',
    'SUPPLIER_ACCEPTED',
    'IN_PRODUCTION',
    'QUALITY_CHECK',
    'DISPATCHED',
    'DELIVERED'
  ];

  const timelineHTML = `
    <div class="order-timeline-card">
      <h3>Order Progress – ${order.order_number}</h3>

      <div class="timeline">
        ${steps.map(step => {
          let cls = '';
          if (order.timeline.includes(step)) cls = 'completed';
          if (order.current_status === step) cls = 'active';

          return `
            <div class="timeline-step ${cls}">
              <span class="dot"></span>
              <span class="label">${step.replace(/_/g,' ')}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', timelineHTML);
}
async function loadManufacturerOrders() {
  const res = await fetch('/api/orders/manufacturer', {
    headers: authHeaders()
  });

  if (!res.ok) return;

  const data = await res.json();
  data.orders.forEach(renderOrderTimeline);
}


  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ================= DARK MODE ================= */
const savedTheme = localStorage.getItem('axo_theme');

  // Apply saved theme
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Toggle on click
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');

    localStorage.setItem('axo_theme', isDark ? 'dark' : 'light');
  });
  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', async () => {
    applySidebar();
    setActiveView('manufacturer');
    await loadUser();
    await loadDashboard();
    await loadManufacturerOrders();

  });

  logoutBtn.addEventListener('click', logout);
})();
