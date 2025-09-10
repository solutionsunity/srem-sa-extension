/*
 * SREM.sa Real Estate Deeds Bridge - Auth Response Builder
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Centralized authentication response building to eliminate DRY violations
 */

/**
 * Centralized authentication response builder
 * Eliminates duplicated auth response patterns across components
 */
const AuthResponseBuilder = {
  /**
   * Build standard authentication status response
   * @param {string} requestId - Request identifier
   * @param {boolean} authenticated - Authentication status
   * @param {string} status - Status code (valid, invalid, error, expired, etc.)
   * @param {string} message - Human-readable message
   * @param {string} targetOrigin - Target origin for postMessage (default: "*")
   * @returns {Object} Standardized auth response object
   */
  buildAuthResponse(requestId, authenticated, status, message, targetOrigin = "*") {
    return {
      type: "SREM_AUTH_STATUS_RESPONSE",
      requestId: requestId,
      authenticated: authenticated,
      status: status,
      message: message,
      timestamp: Date.now(),
      targetOrigin: targetOrigin
    };
  },

  /**
   * Build authentication success response
   * @param {string} requestId - Request identifier
   * @param {string} message - Success message (optional)
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Success auth response
   */
  buildAuthSuccess(requestId, message = "Connected to SREM", targetOrigin = "*") {
    return this.buildAuthResponse(requestId, true, "valid", message, targetOrigin);
  },

  /**
   * Build authentication failure response
   * @param {string} requestId - Request identifier
   * @param {string} reason - Failure reason (expired, invalid, error)
   * @param {string} message - Error message (optional)
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Failure auth response
   */
  buildAuthFailure(requestId, reason = "invalid", message = "Not connected to SREM. Please login first.", targetOrigin = "*") {
    return this.buildAuthResponse(requestId, false, reason, message, targetOrigin);
  },

  /**
   * Build authentication error response (for extension errors)
   * @param {string} requestId - Request identifier
   * @param {string} errorMessage - Specific error message
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Error auth response
   */
  buildAuthError(requestId, errorMessage = "Extension error. Please reload the page.", targetOrigin = "*") {
    return this.buildAuthResponse(requestId, false, "error", errorMessage, targetOrigin);
  },

  /**
   * Build authentication timeout response
   * @param {string} requestId - Request identifier
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Timeout auth response
   */
  buildAuthTimeout(requestId, targetOrigin = "*") {
    return this.buildAuthResponse(requestId, false, "timeout", "Authentication check timeout", targetOrigin);
  },

  /**
   * Build authentication expired response
   * @param {string} requestId - Request identifier
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Expired auth response
   */
  buildAuthExpired(requestId, targetOrigin = "*") {
    return this.buildAuthResponse(requestId, false, "expired", "Authentication expired. Please login again.", targetOrigin);
  },

  /**
   * Send authentication response via postMessage
   * @param {Object} authResponse - Response object from build methods
   * @param {Window} targetWindow - Target window (default: window)
   */
  sendAuthResponse(authResponse, targetWindow = window) {
    const { targetOrigin, ...responseData } = authResponse;
    targetWindow.postMessage(responseData, targetOrigin);
  },

  /**
   * Build and send authentication response in one call
   * @param {string} requestId - Request identifier
   * @param {boolean} authenticated - Authentication status
   * @param {string} status - Status code
   * @param {string} message - Message
   * @param {string} targetOrigin - Target origin
   * @param {Window} targetWindow - Target window
   */
  buildAndSendAuthResponse(requestId, authenticated, status, message, targetOrigin = "*", targetWindow = window) {
    const response = this.buildAuthResponse(requestId, authenticated, status, message, targetOrigin);
    this.sendAuthResponse(response, targetWindow);
  },

  /**
   * Convert chrome.runtime response to auth response
   * @param {string} requestId - Request identifier
   * @param {Object} chromeResponse - Response from chrome.runtime.sendMessage
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Standardized auth response
   */
  fromChromeResponse(requestId, chromeResponse, targetOrigin = "*") {
    if (!chromeResponse) {
      return this.buildAuthError(requestId, "No response from extension", targetOrigin);
    }

    return this.buildAuthResponse(
      requestId,
      chromeResponse.authenticated || false,
      chromeResponse.status || "unknown",
      chromeResponse.message || "Unknown status",
      targetOrigin
    );
  },

  /**
   * Handle chrome.runtime.lastError and build appropriate response
   * @param {string} requestId - Request identifier
   * @param {string} targetOrigin - Target origin for postMessage
   * @returns {Object} Error auth response
   */
  fromChromeError(requestId, targetOrigin = "*") {
    const errorMessage = chrome.runtime.lastError 
      ? `Extension error: ${chrome.runtime.lastError.message}`
      : "Extension context invalidated. Please reload the page.";
    
    return this.buildAuthError(requestId, errorMessage, targetOrigin);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthResponseBuilder;
}

// Make globally available for content scripts
if (typeof window !== 'undefined') {
  window.AuthResponseBuilder = AuthResponseBuilder;
}
