/**
 * SREM Bridge Demo JavaScript
 * Tests the SREM extension bridge API functionality
 * © 2025 Solutions Unity Co.
 */

// DOM elements
const log = document.getElementById('responseLog');
const statusDiv = document.getElementById('statusResult');
const searchDiv = document.getElementById('searchResult');

// Utility functions
function addLog(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type}: ${message}\n`;
    log.textContent += logEntry;
    log.scrollTop = log.scrollHeight;
}

function showStatus(message, type = 'info') {
    statusDiv.innerHTML = message;
    statusDiv.className = `status-card status-${type}`;
    statusDiv.style.display = 'block';
}

function showSearchResult(message, type = 'info') {
    searchDiv.innerHTML = message;
    searchDiv.className = `status-card status-${type}`;
    searchDiv.style.display = 'block';
}

function toggleSearchMode() {
    const mode = document.getElementById('searchMode').value;
    const ownerFields = document.getElementById('ownerFields');
    const dateFields = document.getElementById('dateFields');

    if (mode === 'owner') {
        ownerFields.style.display = 'block';
        dateFields.style.display = 'none';
    } else {
        ownerFields.style.display = 'none';
        dateFields.style.display = 'block';
    }
}

// Extension API functions
function pingExtension() {
    addLog('Pinging extension...', 'REQUEST');
    showStatus('Checking extension availability...', 'info');

    window.postMessage({ type: "SREM_EXTENSION_PING" }, "*");

    setTimeout(() => {
        if (statusDiv.textContent.includes('Checking')) {
            showStatus('❌ No response from extension. Is it installed and enabled?', 'error');
            addLog('Extension ping timeout - no response received', 'ERROR');
        }
    }, 3000);
}

function checkAuth() {
    addLog('Checking authentication status...', 'REQUEST');
    showStatus('Verifying SREM authentication...', 'info');

    const requestId = 'auth_' + Date.now();
    window.postMessage({
        type: "SREM_AUTH_STATUS_REQUEST",
        requestId: requestId
    }, "*");

    setTimeout(() => {
        if (statusDiv.textContent.includes('Verifying')) {
            showStatus('❌ No auth response. Check if you are logged into SREM.', 'error');
            addLog('Authentication check timeout - no response received', 'ERROR');
        }
    }, 5000);
}

function searchDeeds() {
    const deedNumbers = document.getElementById('deedNumbers').value.trim();
    const searchMode = document.getElementById('searchMode').value;

    if (!deedNumbers) {
        showSearchResult('❌ Please enter at least one deed number', 'error');
        return;
    }

    const requestData = {
        type: "SREM_BRIDGE_REQUEST",
        requestId: 'search_' + Date.now(),
        deedNumbers: deedNumbers,
        searchMode: searchMode
    };

    if (searchMode === 'owner') {
        const ownerId = document.getElementById('ownerId').value.trim();
        if (!ownerId) {
            showSearchResult('❌ Please enter owner ID for owner search', 'error');
            return;
        }
        requestData.ownerIdType = parseInt(document.getElementById('ownerIdType').value);
        requestData.ownerId = ownerId;
    } else {
        const deedDate = document.getElementById('deedDate').value;
        if (!deedDate) {
            showSearchResult('❌ Please select deed date for date search', 'error');
            return;
        }
        const date = new Date(deedDate);
        requestData.deedDateYear = date.getFullYear();
        requestData.deedDateMonth = date.getMonth() + 1;
        requestData.deedDateDay = date.getDate();
        requestData.isHijriDate = document.getElementById('calendarType').value === 'true';
    }

    addLog(`Searching deeds: ${deedNumbers} (${searchMode} mode)`, 'REQUEST');
    showSearchResult('🔄 Searching... Please wait.', 'info');

    window.postMessage(requestData, "*");

    setTimeout(() => {
        if (searchDiv.textContent.includes('Searching')) {
            showSearchResult('❌ Search timeout. Check extension and authentication.', 'error');
            addLog('Deed search timeout - no response received', 'ERROR');
        }
    }, 15000);
}

function clearResults() {
    searchDiv.style.display = 'none';
    statusDiv.style.display = 'none';
}

function clearLog() {
    log.textContent = 'Log cleared.\n';
}

function exportLog() {
    const logContent = log.textContent;
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srem-bridge-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Listen for all extension responses
window.addEventListener("message", (event) => {
    const data = event.data;
    addLog(`Received: ${JSON.stringify(data, null, 2)}`, 'RESPONSE');

    switch (data.type) {
        case "SREM_EXTENSION_PONG":
            showStatus('✅ Extension is available and responding!', 'success');
            addLog('Extension ping successful', 'SUCCESS');
            break;

        case "SREM_AUTH_STATUS_RESPONSE":
            if (data.authenticated) {
                showStatus('✅ Authenticated with SREM', 'success');
                addLog('Authentication check successful', 'SUCCESS');
            } else {
                showStatus('❌ Not authenticated. Please login to SREM.', 'error');
                addLog('Authentication check failed - not logged in', 'WARNING');
            }
            break;

        case "SREM_BRIDGE_RESPONSE":
            if (data.success) {
                const successCount = data.results.filter(r => r.success).length;
                const totalCount = data.results.length;

                if (successCount > 0) {
                    showSearchResult(`✅ Search completed! ${successCount}/${totalCount} deeds found.<br>
                        <small>Check the response log for detailed results.</small>`, 'success');
                    addLog(`Search successful: ${successCount}/${totalCount} deeds found`, 'SUCCESS');
                } else {
                    // All deeds failed - show first error
                    const firstError = data.results[0]?.error || 'No results found';
                    showSearchResult(`❌ No deeds found: ${firstError}`, 'warning');
                    addLog(`Search completed but no deeds found: ${firstError}`, 'WARNING');
                }
            } else {
                showSearchResult(`❌ Search failed: ${data.error}`, 'error');
                addLog(`Search failed: ${data.error}`, 'ERROR');
            }
            break;

        default:
            addLog(`Unknown message type: ${data.type}`, 'WARNING');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    addLog('SREM Bridge Demo loaded. Ready to test extension.', 'INFO');
    addLog('Make sure the SREM extension is installed and you are logged into SREM.', 'INFO');
});
