/*
 * SREM.sa Real Estate Deeds Bridge - Background Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

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
      console.log(`Tab ${tab.id} check failed:`, error.message);
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
