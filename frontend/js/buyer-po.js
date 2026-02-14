// =====================================================
// BUYER PO JS - COMPLETE
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    loadPurchaseOrders();
});

// Load purchase orders
async function loadPurchaseOrders() {
    try {
        showSkeletons();

        const token = localStorage.getItem('token');
        const response = await fetch('/api/buyer/purchase-orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/portal-login';
                return;
            }
            throw new Error('Failed to load purchase orders');
        }

        const data = await response.json();
        updatePoTable(data.orders);
        hideSkeletons();

    } catch (error) {
        console.error('Error loading POs:', error);
        showStatusMessage('Failed to load purchase orders', 'error');
        hideSkeletons();
    }
}

// Update PO table
function updatePoTable(orders) {
    const tbody = document.getElementById('poTableBody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No purchase orders found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(po => `
        <tr>
            <td>${po.poId || 'N/A'}</td>
            <td>${po.rfqId || 'N/A'}</td>
            <td>${po.supplierName || 'N/A'}</td>
            <td>${po.quantity ? po.quantity.toLocaleString() : '0'}</td>
            <td>${po.totalPrice ? `$${po.totalPrice.toLocaleString()}` : '$0'}</td>
            <td><span class="status-badge ${(po.status || 'pending').toLowerCase()}">${po.status || 'Pending'}</span></td>
            <td>
                <button onclick="viewPoDetails('${po.poId}')" class="btn-sm">View</button>
            </td>
        </tr>
    `).join('');
}

// View PO details
function viewPoDetails(poId) {
    console.log('View PO details:', poId);
    // Implement as needed
    showStatusMessage(`Viewing PO: ${poId}`, 'info');
}

// Show skeletons
function showSkeletons() {
    document.querySelectorAll('.skeleton').forEach(el => {
        el.classList.remove('fade-out');
    });
}

// Hide skeletons
function hideSkeletons() {
    document.querySelectorAll('.skeleton').forEach(el => {
        el.classList.add('fade-out');
    });
}

// Show status message
function showStatusMessage(message, type = 'success') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Expose functions globally
window.loadPurchaseOrders = loadPurchaseOrders;
window.viewPoDetails = viewPoDetails;
