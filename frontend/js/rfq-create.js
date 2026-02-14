// =====================================================
// RFQ CREATE JS - COMPLETE
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rfqForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Add save draft handler
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }

    // Load user data
    loadUserData();
});

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    try {
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
        submitBtn.disabled = true;

        // Collect form data
        const formData = new FormData();
        formData.append('partName', document.getElementById('part_name').value);
        formData.append('partId', document.getElementById('part_id').value);
        formData.append('totalQuantity', document.getElementById('total_quantity').value);
        formData.append('batchQuantity', document.getElementById('batch_quantity').value || '');
        formData.append('targetPrice', document.getElementById('target_price').value || '');
        formData.append('deliveryTimeline', document.getElementById('delivery_timeline').value);
        formData.append('ppapLevel', document.getElementById('ppap_level').value);
        formData.append('materialSpec', document.getElementById('material_specification').value);

        // Add files
        const files = document.getElementById('rfq_files').files;
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        // Send to API
        const token = localStorage.getItem('token');
        const response = await fetch('/api/buyer/rfq', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to create RFQ');
        }

        const result = await response.json();

        // Show success message
        showStatusMessage('RFQ created successfully!', 'success');

        // Reset form
        event.target.reset();

    } catch (error) {
        console.error('Error creating RFQ:', error);
        showStatusMessage(error.message || 'Failed to create RFQ', 'error');

        // Reset button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Submit RFQ';
        submitBtn.disabled = false;
    }
}

// Validate form
function validateForm() {
    const requiredFields = [
        { id: 'part_name', name: 'Part Name' },
        { id: 'part_id', name: 'Part ID' },
        { id: 'total_quantity', name: 'Total Quantity' },
        { id: 'delivery_timeline', name: 'Delivery Timeline' },
        { id: 'material_specification', name: 'Material Specification' },
        { id: 'ppap_level', name: 'PPAP Level' }
    ];

    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            if (element) {
                element.style.borderColor = '#dc2626';
                element.focus();
            }
            showStatusMessage(`${field.name} is required`, 'error');
            return false;
        }
        if (element) {
            element.style.borderColor = '#e5e7eb';
        }
    }

    // Validate quantity
    const quantity = document.getElementById('total_quantity').value;
    if (quantity <= 0) {
        showStatusMessage('Quantity must be greater than 0', 'error');
        return false;
    }

    // Validate batch quantity if provided
    const batchQuantity = document.getElementById('batch_quantity').value;
    if (batchQuantity && batchQuantity <= 0) {
        showStatusMessage('Batch quantity must be greater than 0', 'error');
        return false;
    }

    return true;
}

// Save as draft
async function saveDraft() {
    try {
        const draftData = {
            partName: document.getElementById('part_name').value,
            partId: document.getElementById('part_id').value,
            totalQuantity: document.getElementById('total_quantity').value,
            batchQuantity: document.getElementById('batch_quantity').value,
            targetPrice: document.getElementById('target_price').value,
            deliveryTimeline: document.getElementById('delivery_timeline').value,
            ppapLevel: document.getElementById('ppap_level').value,
            materialSpec: document.getElementById('material_specification').value,
            status: 'draft',
            draftId: 'DRAFT-' + Date.now(),
            createdAt: new Date().toISOString()
        };

        // Save to local storage
        const drafts = JSON.parse(localStorage.getItem('rfqDrafts') || '[]');
        drafts.push(draftData);
        localStorage.setItem('rfqDrafts', JSON.stringify(drafts));

        showStatusMessage('Draft saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving draft:', error);
        showStatusMessage('Failed to save draft', 'error');
    }
}

// Load user data
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/buyer/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            const userEmailSpan = document.getElementById('userEmail');
            if (userEmailSpan) {
                userEmailSpan.textContent = user.email || 'buyer@axonetworks.com';
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Show status message
function showStatusMessage(message, type = 'success') {
    let statusEl = document.getElementById('statusMessage');
    
    // Create status message element if it doesn't exist
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'statusMessage';
        statusEl.className = 'status-message';
        const form = document.getElementById('rfqForm');
        if (form) {
            form.parentNode.insertBefore(statusEl, form);
        }
    }
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Expose functions globally
window.initializeRfqForm = function() {
    // Any initialization code
    console.log('RFQ Form initialized');
};
