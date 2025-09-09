/*
 * SREM.sa Real Estate Deeds Bridge - Full Page Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const searchModeTabs = document.querySelectorAll('.search-mode-tab');
const searchModeContents = document.querySelectorAll('.search-mode-content');
const resultsCard = document.getElementById('resultsCard');
const resultsContainer = document.getElementById('resultsContainer');
const resultsCount = document.getElementById('resultsCount');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const searchBtn = document.getElementById('searchBtn');

// Form elements
const deedNumbers = document.getElementById('deedNumbers');
const ownerIdType = document.getElementById('ownerIdType');
const ownerId = document.getElementById('ownerId');
const deedDate = document.getElementById('deedDate');
const calendarType = document.getElementById('calendarType');

// State
let currentResults = [];
let currentMode = 'date';

// Update status display
const updateStatus = (connected) => {
  statusIndicator.className = `status-indicator status-${connected ? 'connected' : 'disconnected'}`;
  statusText.textContent = connected ? 'متصل' : 'غير متصل';
};

// Show alert
const showAlert = (message, type = 'info') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.main-container').insertBefore(alertDiv, document.querySelector('.search-card'));
  setTimeout(() => alertDiv.remove(), 5000);
};

// Check authentication status
const checkAuthStatus = () => {
  chrome.runtime.sendMessage({ type: "getAuthStatus" }, (response) => {
    updateStatus(response?.authenticated || false);
    if (!response?.authenticated) {
      showAlert('غير متصل بخدمة صكوك. يرجى تسجيل الدخول أولاً', 'warning');
    }
  });
};

// Search for deeds
const searchDeeds = async () => {
  const deedNumbersValue = deedNumbers.value.trim();
  if (!deedNumbersValue) {
    showAlert('يرجى إدخال رقم صك واحد على الأقل', 'warning');
    return;
  }

  searchBtn.disabled = true;
  searchBtn.innerHTML = '🔄 جاري البحث...';

  const searchData = {
    type: "fetchDeeds",
    deedNumbers: deedNumbersValue,
    searchMode: currentMode
  };

  if (currentMode === 'owner') {
    if (!ownerId.value.trim()) {
      showAlert('يرجى إدخال رقم الهوية', 'warning');
      searchBtn.disabled = false;
      searchBtn.innerHTML = '🔍 استعلام عن الصكوك';
      return;
    }
    searchData.ownerIdType = ownerIdType.value;
    searchData.ownerId = ownerId.value.trim();
  } else {
    if (!deedDate.value) {
      showAlert('يرجى إدخال تاريخ الصك', 'warning');
      searchBtn.disabled = false;
      searchBtn.innerHTML = '🔍 استعلام عن الصكوك';
      return;
    }
    const date = new Date(deedDate.value);
    searchData.deedDateYear = date.getFullYear();
    searchData.deedDateMonth = date.getMonth() + 1;
    searchData.deedDateDay = date.getDate();
    searchData.isHijriDate = calendarType.value === 'hijri';
  }

  chrome.runtime.sendMessage(searchData, (response) => {
    searchBtn.disabled = false;
    searchBtn.innerHTML = '🔍 استعلام عن الصكوك';

    if (response?.success) {
      currentResults = response.results;
      displayResults();
      showAlert(`تم العثور على ${response.totalSuccessful} من أصل ${response.totalRequested} صك`, 'success');
    } else {
      showAlert(response?.error || 'حدث خطأ أثناء البحث', 'danger');
    }
  });
};

// Display search results
const displayResults = () => {
  resultsContainer.innerHTML = '';
  resultsCount.textContent = `${currentResults.length} نتيجة`;
  downloadAllBtn.disabled = currentResults.filter(r => r.data).length === 0;

  currentResults.forEach((result, index) => {
    const resultDiv = document.createElement('div');
    resultDiv.className = `deed-result ${result.success ? 'success' : 'error'}`;

    resultDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h6 class="mb-0">صك رقم: ${result.deedNumber}</h6>
        <span class="badge bg-${result.success ? 'success' : 'danger'}">
          ${result.success ? 'نجح' : 'فشل'}
        </span>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        ${!result.success ? `<small class="text-danger">${result.error}</small>` : ''}
        ${result.data ?
          `<button class="btn btn-sm btn-outline-primary download-btn" data-index="${index}">
            💾 تحميل JSON
          </button>` : ''
        }
      </div>
    `;

    resultsContainer.appendChild(resultDiv);
  });

  resultsCard.style.display = 'block';
};

// Download single result
const downloadResult = (index) => {
  const result = currentResults[index];
  if (!result.data) return;

  // Use consistent schema: always wrap in { result: [...] }
  const standardizedOutput = {
    result: [result.data]
  };

  const blob = new Blob([JSON.stringify(standardizedOutput, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deed_${result.deedNumber}_${result.success ? 'success' : 'response'}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Download all results
const downloadAll = () => {
  const resultsWithData = currentResults.filter(r => r.data);
  if (resultsWithData.length === 0) return;

  // Use consistent schema: always wrap in { result: [...] }
  const standardizedOutput = {
    result: resultsWithData.map(r => r.data)
  };

  const blob = new Blob([JSON.stringify(standardizedOutput, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `srem_deeds_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  // Tab switching
  searchModeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentMode = tab.dataset.mode;
      searchModeTabs.forEach(t => t.classList.remove('active'));
      searchModeContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${currentMode}Mode`).classList.add('active');
    });
  });

  searchBtn.addEventListener('click', searchDeeds);
  downloadAllBtn.addEventListener('click', downloadAll);

  // Event delegation for download buttons
  resultsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('download-btn')) {
      const index = parseInt(event.target.dataset.index);
      downloadResult(index);
    }
  });
});

// Listen for status updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "authStatusUpdate") {
    updateStatus(message.authenticated);
    if (!message.authenticated) {
      showAlert(message.message || 'انتهت صلاحية تسجيل الدخول', 'warning');
    }
  }
});

// downloadResult is now handled via event delegation
