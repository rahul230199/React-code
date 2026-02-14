// =====================================================
// RFQ DETAIL JS - COMPLETE
// =====================================================

let currentRfqId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get RFQ ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentRfqId = urlParams.get('id');
    
    if (currentRfqId) {
        loadRfqDetail(currentRfqId);
    }
    
    // Setup message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});

// Load RFQ details
async function loadRfqDetail(rfqId) {
    if (!rfqId) return;
    
    try {
        showSkeletons();

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/buyer/rfq/${rfqId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/portal-login';
                return;
            }
            throw new Error('Failed to load RFQ details');
        }

        const rfq = await response.json();

        // Update detail view
        document.getElementById('detailRfqIdDisplay').textContent = `RFQ ID: ${rfq.rfqId}`;
        document.getElementById('detailPartName').textContent = rfq.partName || 'N/A';
        document.getElementById('detailTotalQty').textContent = rfq.totalQuantity ? rfq.totalQuantity.toLocaleString() : '0';

        const statusEl = document.getElementById('detailRfqStatus');
        if (statusEl) {
            statusEl.textContent = rfq.status || 'Draft';
            statusEl.className = `status-badge ${(rfq.status || 'draft').toLowerCase()}`;
        }

        document.getElementById('detailCreatedDate').textContent = rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : 'N/A';
        document.getElementById('detailDeliveryTimeline').textContent = rfq.deliveryTimeline || 'Not specified';
        document.getElementById('detailPpapLevel').textContent = rfq.ppapLevel || 'Not specified';
        document.getElementById('detailMaterialSpec').textContent = rfq.materialSpec || 'No specification';

        updateDetailFiles(rfq.files);
        updateDetailQuotes(rfq.quotes);
        updateDetailMessages(rfq.messages);

        if (rfq.purchaseOrder) {
            showDetailPurchaseOrder(rfq.purchaseOrder);
        }

        hideSkeletons();

    } catch (error) {
        console.error('Error loading RFQ details:', error);
        showStatusMessage('Failed to load RFQ details', 'error');
        hideSkeletons();
    }
}

function updateDetailFiles(files) {
    const fileList = document.getElementById('detailFileList');
    if (!fileList) return;

    if (!files || files.length === 0) {
        fileList.innerHTML = '<li class="file-item">No files uploaded</li>';
        return;
    }

    fileList.innerHTML = files.map(file => `
        <li class="file-item">
            <a href="${file.url}" target="_blank">${file.name}</a>
        </li>
    `).join('');
}

function updateDetailQuotes(quotes) {
    const quotesContainer = document.getElementById('quotesContainer');
    if (!quotesContainer) return;

    if (!quotes || quotes.length === 0) {
        quotesContainer.innerHTML = '<p>No quotes received yet</p>';
        return;
    }

    quotesContainer.innerHTML = quotes.map(quote => `
        <div class="quote-card">
            <div class="quote-header">${quote.supplierName || 'Supplier'}</div>
            <div class="quote-details">
                <div><span>Quote:</span> <strong>$${quote.pricePerUnit || '0'}/unit</strong></div>
                <div><span>Delivery:</span> <strong>${quote.deliveryTimeline || 'N/A'}</strong></div>
                <div><span>MOQ:</span> <strong>${quote.moq || '0'}</strong></div>
            </div>
            <div class="quote-actions">
                <button class="btn-success" onclick="acceptQuote('${quote.quoteId}')">Accept</button>
                <button class="btn-outline" onclick="viewQuoteDetails('${quote.quoteId}')">Details</button>
            </div>
        </div>
    `).join('');
}

function updateDetailMessages(messages) {
    const messageList = document.getElementById('messageList');
    if (!messageList) return;

    if (!messages || messages.length === 0) {
        messageList.innerHTML = '<p class="text-center">No messages yet</p>';
        return;
    }

    messageList.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.sender === 'buyer' ? 'sent' : 'received'}">
            <div class="message-bubble">${msg.content}</div>
            <span class="message-time">${msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
        </div>
    `).join('');
    
    // Scroll to bottom
    messageList.scrollTop = messageList.scrollHeight;
}

function showDetailPurchaseOrder(po) {
    const poSection = document.getElementById('poSection');
    if (!poSection) return;

    poSection.style.display = 'block';
    document.getElementById('poId').textContent = po.poId || '—';
    document.getElementById('poQty').textContent = po.quantity ? po.quantity.toLocaleString() : '—';
    document.getElementById('poPrice').textContent = po.totalPrice ? `$${po.totalPrice.toLocaleString()}` : '—';
    
    const statusEl = document.getElementById('poStatus');
    if (statusEl) {
        statusEl.textContent = po.status || 'ISSUED';
        statusEl.className = `status-badge ${(po.status || 'issued').toLowerCase()}`;
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !currentRfqId) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/buyer/rfq/${currentRfqId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) throw new Error('Failed to send message');
        
        // Clear input
        input.value = '';
        
        // Reload messages
        const result = await response.json();
        updateDetailMessages(result.messages);
        
    } catch (error) {
        console.error('Error sending message:', error);
        showStatusMessage('Failed to send message', 'error');
    }
}

// Accept quote
async function acceptQuote(quoteId) {
    if (!confirm('Are you sure you want to accept this quote? This will create a purchase order.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/buyer/quotes/${quoteId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to accept quote');
        
        const po = await response.json();
        
        showStatusMessage('Quote accepted! Purchase order created.', 'success');
        
        // Show PO section
        showDetailPurchaseOrder(po);
        
        // Reload quotes
        if (currentRfqId) {
            loadRfqDetail(currentRfqId);
        }
        
    } catch (error) {
        console.error('Error accepting quote:', error);
        showStatusMessage('Failed to accept quote', 'error');
    }
}

// View quote details
function viewQuoteDetails(quoteId) {
    console.log('View quote details:', quoteId);
    // Implement as needed
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

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Expose functions globally
window.loadRfqDetail = loadRfqDetail;
window.sendMessage = sendMessage;
window.acceptQuote = acceptQuote;
window.viewQuoteDetails = viewQuoteDetails;
