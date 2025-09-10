/*
 * SREM.sa Real Estate Deeds Bridge - Full Page Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

// Utilities are pre-loaded via script tags in fullpage.html
// Available: window.RequestBuilder, window.ResponseFormatter, window.ChromeRuntimeHelper

// ResponseFormatter is available via shared-utils.js pre-loaded in HTML

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
const hijriDateInputs = document.getElementById('hijriDateInputs');
const hijriDay = document.getElementById('hijriDay');
const hijriMonth = document.getElementById('hijriMonth');
const hijriYear = document.getElementById('hijriYear');

// State
let currentResults = [];
let currentMode = 'date';

// Handle calendar type switching
const handleCalendarTypeChange = () => {
  const isHijri = calendarType.value === 'hijri';

  if (isHijri) {
    deedDate.style.display = 'none';
    hijriDateInputs.style.display = 'block';
  } else {
    deedDate.style.display = 'block';
    hijriDateInputs.style.display = 'none';
  }
};

// Update status display
const updateStatus = (connected) => {
  statusIndicator.className = `status-indicator status-${connected ? 'connected' : 'disconnected'}`;
  statusText.textContent = connected ? 'متصل' : 'غير متصل';

  // Enable/disable search button based on connection status
  searchBtn.disabled = !connected;
  if (!connected) {
    searchBtn.innerHTML = '🔒 يرجى تسجيل الدخول أولاً';
    searchBtn.title = 'يجب تسجيل الدخول إلى خدمة صكوك أولاً';
  } else {
    searchBtn.innerHTML = '🔍 استعلام عن الصكوك';
    searchBtn.title = 'البحث عن الصكوك العقارية';
  }
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
  window.ChromeRuntimeHelper.sendMessageSafely({ type: "getAuthStatus" }, (response, error) => {
    if (error) {
      updateStatus(false);
      showAlert(`خطأ في التحقق من الاتصال: ${error.message}`, 'danger');
    } else {
      updateStatus(response?.authenticated || false);
      if (!response?.authenticated) {
        showAlert('غير متصل بخدمة صكوك. يرجى تسجيل الدخول أولاً', 'warning');
      }
    }
  });
};

// Search for deeds
const searchDeeds = async () => {
  // Don't proceed if button is already disabled due to connection issues
  if (searchBtn.disabled) {
    return;
  }

  searchBtn.disabled = true;
  searchBtn.innerHTML = '🔄 جاري البحث...';

  // Prepare request data
  const requestData = {
    type: "fetchDeeds",
    requestId: window.RequestIdGenerator.forFullpage(),
    deedNumbers: deedNumbers.value,
    searchMode: currentMode
  };

  if (currentMode === 'owner') {
    requestData.ownerIdType = parseInt(ownerIdType.value);
    requestData.ownerId = ownerId.value;
  } else {
    const isHijri = calendarType.value === 'hijri';

    if (isHijri) {
      // Use Hijri date inputs
      if (hijriDay.value && hijriMonth.value && hijriYear.value) {
        const dateComponents = window.DateFormatter.formatManualDate(
          hijriYear.value, hijriMonth.value, hijriDay.value
        );
        Object.assign(requestData, dateComponents);
        requestData.isHijriDate = true;
      }
    } else {
      // Use Gregorian date input
      if (deedDate.value) {
        const dateComponents = window.DateFormatter.formatGregorianDate(deedDate.value);
        Object.assign(requestData, dateComponents);
        requestData.isHijriDate = false;
      }
    }
  }

  // Use centralized validation
  const validationResult = window.RequestBuilder.validateAndBuildRequest(requestData);

  if (!validationResult.success) {
    // Convert validation errors to Arabic messages with consolidation
    const errorTypes = new Set();
    validationResult.errors.forEach(error => {
      if (error.includes('Deed numbers are required')) errorTypes.add('يرجى إدخال رقم صك واحد على الأقل');
      else if (error.includes('Owner ID is required')) errorTypes.add('يرجى إدخال رقم الهوية');
      else if (error.includes('deed date')) errorTypes.add('يرجى إدخال تاريخ الصك');
      else if (error.includes('Hijri year')) errorTypes.add('يرجى إدخال سنة هجرية صحيحة (1400-1500)');
      else if (error.includes('Gregorian year')) errorTypes.add('يرجى إدخال سنة ميلادية صحيحة (1900-2100)');
      else errorTypes.add(error);
    });

    showAlert(Array.from(errorTypes).join('، '), 'warning');
    // Restore button state based on current connection status
    checkAuthStatus();
    return;
  }

  // Build request with only required parameters for the search mode
  const searchData = {
    type: "fetchDeeds",
    deedNumbers: validationResult.data.deedNumbers,
    searchMode: validationResult.data.searchMode
  };

  // Add ONLY the required parameters for each search mode
  if (validationResult.data.searchMode === 'owner') {
    searchData.ownerIdType = validationResult.data.ownerIdType;
    searchData.ownerId = validationResult.data.ownerId;
    // Do NOT send date parameters for owner search
  } else if (validationResult.data.searchMode === 'date') {
    searchData.deedDateYear = validationResult.data.deedDateYear;
    searchData.deedDateMonth = validationResult.data.deedDateMonth;
    searchData.deedDateDay = validationResult.data.deedDateDay;
    searchData.isHijriDate = validationResult.data.isHijriDate;
    // Do NOT send owner parameters for date search
  }

  // Use ChromeRuntimeHelper for safe message sending
  window.ChromeRuntimeHelper.sendMessageSafely(searchData, (response, error) => {
    // Restore button state based on current connection status
    checkAuthStatus();

    if (error) {
      showAlert(`خطأ في الاتصال: ${error.message}`, 'danger');
    } else if (response?.success) {
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

  // Use centralized response formatter for consistent output
  const standardizedOutput = window.ResponseFormatter.formatDataResponse([result]);

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

  // Use centralized response formatter for consistent output
  const standardizedOutput = ResponseFormatter.formatDataResponse(resultsWithData);

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
  calendarType.addEventListener('change', handleCalendarTypeChange);

  // Event delegation for download buttons
  resultsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('download-btn')) {
      const index = parseInt(event.target.dataset.index);
      downloadResult(index);
    }
  });

  // Initialize calendar display
  handleCalendarTypeChange();
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
