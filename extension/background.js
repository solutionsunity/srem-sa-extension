/*
 * SREM.sa Real Estate Deeds Bridge - Background Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

// Import centralized utilities (includes both RequestBuilder and ResponseFormatter)
importScripts('shared-utils.js');

// Global approval tracking
const pendingApprovals = new Map();

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

        const windowId = window.id;

        // Set up timeout for approval (30 seconds)
        const timeout = setTimeout(() => {
          pendingApprovals.delete(origin);
          resolve({
            approved: false,
            reason: 'timeout'
          });
        }, 30000);

        // Handle window close (user closes popup without decision)
        const windowCloseListener = (closedWindowId) => {
          if (closedWindowId === windowId) {
            console.log('Approval popup closed without decision');
            const pendingRequest = pendingApprovals.get(origin);
            if (pendingRequest) {
              clearTimeout(pendingRequest.timeout);
              pendingApprovals.delete(origin);
              resolve({
                approved: false,
                reason: 'popup_closed'
              });
            }
            chrome.windows.onRemoved.removeListener(windowCloseListener);
          }
        };

        // Store the pending request globally
        pendingApprovals.set(origin, {
          resolve,
          timeout,
          windowId
        });

        chrome.windows.onRemoved.addListener(windowCloseListener);
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

// Cache for preventing duplicate broadcasts
let lastAuthStatus = null;

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

// Check auth status and broadcast if changed
const checkAndBroadcastAuthStatus = async (source = "unknown") => {
  try {
    const currentStatus = await getAuthStatus();

    // Only broadcast if status actually changed
    const statusChanged = !lastAuthStatus ||
                         lastAuthStatus.authenticated !== currentStatus.authenticated ||
                         lastAuthStatus.message !== currentStatus.message;

    if (statusChanged) {
      console.log(`Auth status changed (${source}):`, currentStatus);

      // Update cache
      lastAuthStatus = { ...currentStatus };

      // Broadcast to all extension contexts
      const broadcastMessage = {
        type: "authStatusUpdate",
        authenticated: currentStatus.authenticated,
        status: currentStatus.status,
        message: currentStatus.message,
        timestamp: Date.now(),
        source: source
      };

      // Send to all extension pages (popup, fullpage, etc.)
      chrome.runtime.sendMessage(broadcastMessage).catch(() => {
        // Ignore errors if no listeners (normal when popup/fullpage not open)
      });

      console.log(`Broadcasted auth status update from ${source}`);
    }

    return currentStatus;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return lastAuthStatus || { authenticated: false, status: "error", message: "Error checking status" };
  }
};

// Utilities are now available as RequestBuilder and ResponseFormatter

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

    // Extract and validate parameters using centralized RequestBuilder
    const params = RequestBuilder.extractAllParameters(message);
    const deedList = RequestBuilder.parseDeedNumbers(params.deedNumbers);
    const results = [];

    if (deedList.length === 0) {
      sendResponse({
        success: false,
        error: "No valid deed numbers provided",
        results: []
      });
      return;
    }

    for (const deedNumber of deedList) {
      try {
        // Use centralized API payload building
        const { apiUrl, payload } = RequestBuilder.buildApiPayload({ data: params }, deedNumber);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authStatus.token}`
          },
          body: JSON.stringify(payload)
        });

        // Handle HTTP error status codes before attempting JSON parsing
        if (response.status === 401) {
          throw new Error("Authentication expired. Please login to SREM again.");
        }

        if (response.status === 503) {
          throw new Error("SREM service is temporarily unavailable (503). Please try again later.");
        }

        if (response.status === 500) {
          throw new Error("SREM internal server error (500). Please try again later.");
        }

        if (response.status === 404) {
          throw new Error("SREM API endpoint not found (404). Please check your request.");
        }

        if (!response.ok) {
          throw new Error(`SREM API error: HTTP ${response.status} ${response.statusText}`);
        }

        // Only attempt JSON parsing for successful HTTP responses
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error(`SREM API returned invalid JSON response: ${jsonError.message}`);
        }

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

    // Use centralized response formatter for internal communication
    sendResponse(ResponseFormatter.formatInternalResponse(results));

  } catch (error) {
    // Use centralized response formatter for error responses
    sendResponse(ResponseFormatter.formatInternalResponse([], "error"));
  }
};

// Handle domain approval response from approval.html
function handleDomainApprovalResponse(message) {
  const { origin, approved } = message;
  const pendingRequest = pendingApprovals.get(origin);

  if (pendingRequest) {
    console.log('Processing domain approval response:', { origin, approved });

    // Clear the pending request
    pendingApprovals.delete(origin);

    // Clear any timeout
    if (pendingRequest.timeout) {
      clearTimeout(pendingRequest.timeout);
    }

    // Process the approval
    if (approved) {
      whitelist.approve(origin, 60); // Fixed 60 days
      const domain = whitelist.domains.get(origin);
      pendingRequest.resolve({
        approved: true,
        expiresAt: new Date(domain.expires).toISOString(),
        reason: 'user_approved'
      });
    } else {
      pendingRequest.resolve({
        approved: false,
        reason: 'user_denied'
      });
    }
  }
}

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getAuthStatus":
      // Check and broadcast, then return current status
      checkAndBroadcastAuthStatus("manual_check").then(sendResponse);
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
    case "DOMAIN_APPROVAL":
      // Handle approval response from approval.html
      handleDomainApprovalResponse(message);
      sendResponse({ success: true });
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
      // Check and broadcast, then return current status
      checkAndBroadcastAuthStatus("external_check").then(sendResponse);
      return true;
  }
});

// Periodic auth status monitoring
// Check every 30 seconds for auth status changes
setInterval(() => {
  checkAndBroadcastAuthStatus("periodic_check");
}, 30000);

// Initial status check on extension startup
checkAndBroadcastAuthStatus("startup");
