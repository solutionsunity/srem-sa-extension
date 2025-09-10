// Bridge content script for external app integration
// This script runs on localhost and other specified domains to enable communication

// Utilities are pre-loaded via manifest.json content_scripts
// Available: window.RequestBuilder, window.ResponseFormatter, window.AuthResponseBuilder, window.ChromeRuntimeHelper

// Fallback response formatter for immediate use
const ResponseFormatterFallback = {
  formatBridgeResponse(requestId, sremResults, authStatus = "authenticated") {
    const successfulResults = sremResults.filter(r => r.success && r.data);
    const failedResults = sremResults.filter(r => !r.success);
    const overallSuccess = successfulResults.length > 0;

    return {
      type: "SREM_BRIDGE_RESPONSE",
      requestId: requestId,
      success: overallSuccess,
      result: successfulResults.map(r => r.data), // Raw SREM data - no wrapper
      error: overallSuccess ? null : this._buildErrorMessage(failedResults),
      authStatus: authStatus,
      metadata: {
        totalRequested: sremResults.length,
        totalSuccessful: successfulResults.length,
        totalFailed: failedResults.length,
        failures: failedResults.map(r => ({
          deedNumber: r.deedNumber,
          error: r.error
        }))
      }
    };
  },

  formatBridgeError(requestId, error, authStatus = "error") {
    return {
      type: "SREM_BRIDGE_RESPONSE",
      requestId: requestId,
      success: false,
      result: [],
      error: error,
      authStatus: authStatus,
      metadata: {
        totalRequested: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        failures: []
      }
    };
  },

  _buildErrorMessage(failedResults) {
    if (failedResults.length === 0) return null;
    if (failedResults.length === 1) return failedResults[0].error;
    return `${failedResults.length} deeds failed. First error: ${failedResults[0].error}`;
  }
};

// Check if extension context is valid before proceeding
(function () {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            return;
        }
    } catch (error) {
        return;
    }

    // Bridge ready notification removed for security - extension stays hidden until approved

    // Listen for messages from the web page
    window.addEventListener("message", (event) => {

        // PUBLIC API 1: Extension Discovery (always responds)
        if (event.data.type === "SREM_EXTENSION_DISCOVERY") {
            try {
                const extensionId = chrome.runtime && chrome.runtime.id ? chrome.runtime.id : 'unknown';
                const manifest = chrome.runtime.getManifest();

                window.postMessage({
                    type: "SREM_EXTENSION_EXISTS",
                    extensionId: extensionId,
                    version: manifest.version,
                    name: manifest.name,
                    timestamp: Date.now()
                }, event.origin);
            } catch (error) {
                // Error responding to discovery - silently fail
            }
            return;
        }

        // PUBLIC API 2: Request Approval (always responds)
        if (event.data.type === "SREM_REQUEST_APPROVAL") {
            chrome.runtime.sendMessage({
                type: "requestDomainApproval",
                origin: event.origin,
                appName: event.data.appName || 'Unknown App',
                reason: event.data.reason || 'Access SREM deed data'
            }, (result) => {
                window.postMessage({
                    type: "SREM_APPROVAL_RESPONSE",
                    approved: result.approved,
                    expiresAt: result.expiresAt,
                    reason: result.reason || (result.approved ? 'approved' : 'denied'),
                    timestamp: Date.now()
                }, event.origin);
            });
            return;
        }

        // PROTECTED APIs (require approval) - Legacy ping support
        if (event.data.type === "SREM_EXTENSION_PING") {
            // Check domain approval first - no response if not approved
            chrome.runtime.sendMessage({
                type: "checkDomainApproval",
                origin: event.origin
            }, (approved) => {
                if (approved) {
                    try {
                        const extensionId = chrome.runtime && chrome.runtime.id ? chrome.runtime.id : 'unknown';
                        // Respond with pong only if domain is approved
                        window.postMessage({
                            type: "SREM_EXTENSION_PONG",
                            timestamp: Date.now(),
                            extensionId: extensionId
                        }, event.origin);
                    } catch (error) {
                        // Error responding to ping - silently fail
                    }
                }
                // If not approved, no response (extension appears dead)
            });
        }

        // Handle external app requests for deed data (requires approval)
        if (event.data.type === "SREM_BRIDGE_REQUEST") {
            handleBridgeRequest(event);
        }

        // Handle authentication status requests (behind whitelist)
        if (event.data.type === "SREM_AUTH_STATUS_REQUEST") {
            // Check domain approval first - no response if not approved
            chrome.runtime.sendMessage({
                type: "checkDomainApproval",
                origin: event.origin
            }, (approved) => {
                if (approved) {
                    handleAuthStatusRequest(event);
                }
                // If not approved, no response (extension appears dead)
            });
        }
    });

    // Store pending requests with their origins for secure responses
    const pendingRequests = new Map();

    // Clean up old requests every 5 minutes to prevent memory leaks
    setInterval(() => {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [requestId, requestInfo] of pendingRequests.entries()) {
            if (now - requestInfo.timestamp > maxAge) {
                pendingRequests.delete(requestId);
            }
        }
    }, 60000); // Check every minute

    // Handle bridge requests from external applications
    function handleBridgeRequest(event) {
        // Extract and validate all parameters using centralized RequestBuilder
        const validationResult = window.RequestBuilder.validateAndBuildRequest(event.data);

        if (!validationResult.success) {
            // Send validation error response
            const errorResponse = window.ResponseFormatter.formatBridgeError(
                event.data.requestId || 'unknown',
                `Invalid request parameters: ${validationResult.errors.join(', ')}`,
                "validation_error"
            );
            window.postMessage(errorResponse, event.origin);
            return;
        }

        const requestId = validationResult.data.requestId;

        // Store the requesting origin for secure response targeting
        pendingRequests.set(requestId, {
            origin: event.origin,
            timestamp: Date.now()
        });

        // Check domain approval first using ChromeRuntimeHelper
        window.ChromeRuntimeHelper.sendMessageSafely({
            type: "checkDomainApproval",
            origin: event.origin
        }, (approved, error) => {
            if (error) {
                const requestInfo = pendingRequests.get(requestId);
                const targetOrigin = requestInfo?.origin || "*";

                const errorResponse = window.ResponseFormatter.formatBridgeError(
                    requestId,
                    `Extension error: ${error.message}`,
                    "extension_error"
                );
                window.postMessage(errorResponse, targetOrigin);
                pendingRequests.delete(requestId);
                return;
            }

            if (!approved) {
                const requestInfo = pendingRequests.get(requestId);
                const targetOrigin = requestInfo?.origin || "*";

                const errorResponse = window.ResponseFormatter.formatBridgeError(
                    requestId,
                    "Domain not approved. Please approve this domain to use SREM bridge.",
                    "domain_not_approved"
                );
                window.postMessage(errorResponse, targetOrigin);
                pendingRequests.delete(requestId);
                return;
            }

            // Domain approved, proceed with request using centralized message builder
            const message = window.RequestBuilder.buildInternalMessage(validationResult);
            window.ChromeRuntimeHelper.sendMessageSafely(message, (response, error) => {
                if (error) {
                    // Send error response back to the requesting origin only
                    const requestInfo = pendingRequests.get(requestId);
                    const targetOrigin = requestInfo?.origin || "*";

                    // Use centralized response formatter for error
                    const errorResponse = window.ResponseFormatter.formatBridgeError(
                        requestId,
                        `Extension error: ${error.message}`,
                        "extension_error"
                    );
                    window.postMessage(errorResponse, targetOrigin);

                    // Clean up stored request
                    pendingRequests.delete(requestId);
                } else {
                    // Send response back to the requesting origin only
                    const requestInfo = pendingRequests.get(requestId);
                    const targetOrigin = requestInfo?.origin || "*";

                    // Use centralized response formatter for success response
                    const bridgeResponse = window.ResponseFormatter.formatBridgeResponse(
                        requestId,
                        response?.results || [],
                        response?.authStatus || "unknown"
                    );
                    window.postMessage(bridgeResponse, targetOrigin);

                    // Clean up stored request
                    pendingRequests.delete(requestId);
                }
            });
        });
    }

    // Handle authentication status requests
    function handleAuthStatusRequest(event) {
        const { requestId } = event.data;

        // Use ChromeRuntimeHelper for safe message sending
        window.ChromeRuntimeHelper.sendMessageSafely({
            type: "getAuthStatus"
        }, (response, error) => {
            let authResponse;

            if (error) {
                // Use AuthResponseBuilder for consistent error responses
                authResponse = window.AuthResponseBuilder.buildAuthError(
                    requestId,
                    `Extension error: ${error.message}`
                );
            } else {
                // Use AuthResponseBuilder for consistent success responses
                authResponse = window.AuthResponseBuilder.fromChromeResponse(
                    requestId,
                    response
                );
            }

            // Send the response
            window.AuthResponseBuilder.sendAuthResponse(authResponse);
        });
    }

    // Bridge ready notification removed - extension stays hidden until approved
    // Domains must ping to discover extension and get approval
})();
