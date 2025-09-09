/*
 * SREM.sa Real Estate Deeds Bridge - Popup Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const statusMessage = document.getElementById('statusMessage');
const connectionInfo = document.getElementById('connectionInfo');
const openFullPageBtn = document.getElementById('openFullPageBtn');
const refreshStatusBtn = document.getElementById('refreshStatusBtn');

// Update status display
const updateStatus = (status, text, message) => {
  statusIndicator.className = `status-indicator status-${status}`;
  statusText.textContent = text;
  statusMessage.textContent = message;
  connectionInfo.className = `connection-info ${status}`;
};

// Check authentication status
const checkAuthStatus = () => {
  updateStatus('checking', 'جاري التحقق...', 'التحقق من الاتصال بخدمة صكوك');

  chrome.runtime.sendMessage({ type: "getAuthStatus" }, (response) => {
    if (chrome.runtime.lastError) {
      updateStatus('disconnected', 'خطأ', 'خطأ في التحقق من الاتصال');
      return;
    }

    if (response?.authenticated) {
      updateStatus('connected', 'متصل', response.message || 'متصل بخدمة صكوك بنجاح');
    } else {
      updateStatus('disconnected', 'غير متصل', response?.message || 'غير متصل بخدمة صكوك. يرجى تسجيل الدخول أولاً');
    }
  });
};

// Domain management functions
const loadDomains = () => {
  chrome.runtime.sendMessage({ type: 'getDomainList' }, (domains) => {
    const domainsList = document.getElementById('domainsList');
    const domainCount = document.getElementById('domainCount');

    if (!domains || domains.length === 0) {
      domainsList.innerHTML = '<small class="text-muted">No approved domains</small>';
      domainCount.textContent = '0';
      return;
    }

    domainCount.textContent = domains.length;
    domainsList.innerHTML = domains.map(domain => `
      <div class="domain-item">
        <div class="domain-name">${domain.origin}</div>
        <div class="domain-expiry">${domain.daysLeft}d left</div>
        <button class="remove-domain" onclick="removeDomain('${domain.origin}')">×</button>
      </div>
    `).join('');
  });
};

const removeDomain = (origin) => {
  chrome.runtime.sendMessage({ type: 'removeDomain', origin }, () => {
    loadDomains();
  });
};

const clearAllDomains = () => {
  if (confirm('Clear all approved domains?')) {
    chrome.runtime.sendMessage({ type: 'clearDomains' }, () => {
      loadDomains();
    });
  }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadDomains();

  openFullPageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('fullpage.html') });
  });

  refreshStatusBtn.addEventListener('click', checkAuthStatus);

  // Domain management handlers
  document.getElementById('refreshDomainsBtn').addEventListener('click', loadDomains);
  document.getElementById('clearAllDomainsBtn').addEventListener('click', clearAllDomains);
});

// Listen for status updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "authStatusUpdate") {
    if (message.authenticated) {
      updateStatus('connected', 'متصل', message.message || 'متصل بخدمة صكوك بنجاح');
    } else {
      updateStatus('disconnected', 'غير متصل', message.message || 'غير متصل بخدمة صكوك');
    }
  }
});
