/*
 * SREM.sa Real Estate Deeds Bridge - Background Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

// Simple Domain Whitelist Manager
class DomainWhitelist {
  constructor() {
    this.domains = new Map();
    this.init();
  }

  async init() {
    const { whitelist } = await chrome.storage.local.get(['whitelist']);
    if (whitelist) {
      this.domains = new Map(Object.entries(whitelist));
      this.cleanup();
    }
  }

  async isApproved(origin) {
    const domain = this.domains.get(origin);
    if (!domain) return false;

    if (Date.now() > domain.expires) {
      this.domains.delete(origin);
      this.save();
      return false;
    }

    domain.lastUsed = Date.now();
    domain.uses++;
    this.save();
    return true;
  }

  async requestApproval(origin, appName = 'Unknown App', reason = 'Access SREM deed data') {
    if (await this.isApproved(origin)) {
      const domain = this.domains.get(origin);
      return {
        approved: true,
        expiresAt: new Date(domain.expires).toISOString(),
        reason: 'already_approved'
      };
    }

    return new Promise((resolve) => {
      const params = new URLSearchParams({
        origin: origin,
        appName: appName,
        reason: reason
      });

      const approvalUrl = chrome.runtime.getURL(`approval.html?${params.toString()}`);

      chrome.windows.create({
        url: approvalUrl,
        type: 'popup',
        width: 430,
        height: 370,
        focused: true
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('Error creating approval popup:', chrome.runtime.lastError);
          resolve({
            approved: false,
            reason: 'popup_creation_failed'
          });
          return;
        }

        const listener = (message) => {
          if (message.type === 'DOMAIN_APPROVAL' && message.origin === origin) {
            chrome.runtime.onMessage.removeListener(listener);
            if (message.approved) {
              this.approve(origin, 60); // Fixed 60 days
              const domain = this.domains.get(origin);
              resolve({
                approved: true,
                expiresAt: new Date(domain.expires).toISOString(),
                reason: 'user_approved'
              });
            } else {
              resolve({
                approved: false,
                reason: 'user_denied'
              });
            }
          }
        };
        chrome.runtime.onMessage.addListener(listener);
      });
    });
  }

  approve(origin, days = 60) {
    this.domains.set(origin, {
      approved: Date.now(),
      expires: Date.now() + (days * 24 * 60 * 60 * 1000),
      days,
      uses: 0,
      lastUsed: Date.now()
    });
    this.save();
  }

  remove(origin) {
    this.domains.delete(origin);
    this.save();
  }

  clear() {
    this.domains.clear();
    this.save();
  }

  list() {
    this.cleanup();
    return Array.from(this.domains.entries()).map(([origin, data]) => ({
      origin,
      ...data,
      daysLeft: Math.ceil((data.expires - Date.now()) / (24 * 60 * 60 * 1000))
    }));
  }

  cleanup() {
    const now = Date.now();
    for (const [origin, data] of this.domains) {
      if (now > data.expires) {
        this.domains.delete(origin);
      }
    }
    this.save();
  }

  save() {
    chrome.storage.local.set({
      whitelist: Object.fromEntries(this.domains)
    });
  }
}

const whitelist = new DomainWhitelist();

// OIDC token extraction function
const getOIDCToken = () => {
  const oidcKey = 'oidc.user:https://sts-srem-sso.red.sa/:SREM.FrontEnd.Prod';
  const oidcData = localStorage.getItem(oidcKey);
  if (!oidcData) return null;

  try {
    const parsed = JSON.parse(oidcData);
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = parsed.expires_at < currentTime;

    return isExpired ? null : {
      access_token: parsed.access_token,
      expires_at: parsed.expires_at
    };
  } catch {
    return null;
  }
};

// Get authentication status
const getAuthStatus = async () => {
  const tabs = await chrome.tabs.query({ url: "*://srem.moj.gov.sa/*" });

  for (const tab of tabs) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getOIDCToken
      });

      if (result?.result) {
        return {
          authenticated: true,
          status: "valid",
          message: "Connected to SREM",
          token: result.result.access_token
        };
      }
    } catch (error) {
      // Tab check failed - continue to next tab
    }
  }

  return {
    authenticated: false,
    status: "invalid",
    message: "Not connected to SREM. Please login first."
  };
};

// Handle deed data requests
const handleDeedRequest = async (message, sendResponse) => {
  try {
    const authStatus = await getAuthStatus();

    if (!authStatus.authenticated) {
      sendResponse({
        success: false,
        error: "Not authenticated. Please login to SREM first.",
        results: []
      });
      return;
    }

    const { deedNumbers, ownerIdType, ownerId, searchMode, deedDateYear, deedDateMonth, deedDateDay, isHijriDate } = message;
    const deedList = deedNumbers.split(/[,;\s:\n\r]+/).filter(Boolean);
    const results = [];

    for (const deedNumber of deedList) {
      try {
        let apiUrl, payload;

        if (searchMode === "date") {
          apiUrl = "https://prod-inquiryservice-srem.moj.gov.sa/api/v1/DeedInquiry/GetDeedByDate";
          payload = {
            deedNumber: deedNumber.trim(),
            deedDateYear: parseInt(deedDateYear),
            deedDateMonth: parseInt(deedDateMonth),
            deedDateDay: parseInt(deedDateDay),
            isHijriDate: isHijriDate || false
          };
        } else {
          apiUrl = "https://prod-inquiryservice-srem.moj.gov.sa/api/v1/DeedInquiry/GetDeedByOwner";
          payload = {
            deedNumber: deedNumber.trim(),
            idType: parseInt(ownerIdType),
            idNumber: ownerId.trim()
          };
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authStatus.token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 401) {
          throw new Error("Authentication expired. Please login to SREM again.");
        }

        const data = await response.json();

        // Check both HTTP status and SREM API success
        const isHttpOk = response.ok;
        const isSremSuccess = data?.IsSuccess === true;
        const overallSuccess = isHttpOk && isSremSuccess;

        results.push({
          deedNumber: deedNumber.trim(),
          success: overallSuccess,
          data: isHttpOk ? data : null,
          error: overallSuccess ? null :
                 !isHttpOk ? `HTTP ${response.status}: ${response.statusText}` :
                 data?.ErrorList?.[0] || data?.ErrorDetails?.[0]?.ErrorDescription || "Unknown SREM error"
        });

      } catch (error) {
        results.push({
          deedNumber: deedNumber.trim(),
          success: false,
          data: null,
          error: error.message
        });
      }
    }

    sendResponse({
      success: true,
      results: results,
      totalRequested: deedList.length,
      totalSuccessful: results.filter(r => r.success).length
    });

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
      results: []
    });
  }
};

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getAuthStatus":
      getAuthStatus().then(sendResponse);
      return true;

    case "fetchDeeds":
      handleDeedRequest(message, sendResponse);
      return true;
    case "checkDomainApproval":
      whitelist.requestApproval(message.origin).then(sendResponse);
      return true;
    case "requestDomainApproval":
      whitelist.requestApproval(message.origin, message.appName, message.reason).then(sendResponse);
      return true;
    case "getDomainList":
      sendResponse(whitelist.list());
      return true;
    case "removeDomain":
      whitelist.remove(message.origin);
      sendResponse({ success: true });
      return true;
    case "clearDomains":
      whitelist.clear();
      sendResponse({ success: true });
      return true;
  }
});

// External message handler
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "fetchDeeds":
      handleDeedRequest(message, sendResponse);
      return true;

    case "getAuthStatus":
      getAuthStatus().then(sendResponse);
      return true;
  }
});
