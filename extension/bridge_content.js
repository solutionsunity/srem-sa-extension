// Bridge content script for external app integration
// This script runs on localhost and other specified domains to enable communication

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
        const { requestId, deedNumbers, ownerIdType, ownerId } = event.data;

        // Store the requesting origin for secure response targeting
        pendingRequests.set(requestId, {
            origin: event.origin,
            timestamp: Date.now()
        });



        // Check domain approval first
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                type: "checkDomainApproval",
                origin: event.origin
            }, (approved) => {
                if (!approved) {
                    const requestInfo = pendingRequests.get(requestId);
                    const targetOrigin = requestInfo?.origin || "*";

                    window.postMessage({
                        type: "SREM_BRIDGE_RESPONSE",
                        requestId: requestId,
                        success: false,
                        results: [],
                        error: "Domain not approved. Please approve this domain to use SREM bridge.",
                        authStatus: "domain_not_approved"
                    }, targetOrigin);

                    pendingRequests.delete(requestId);
                    return;
                }

                // Domain approved, proceed with request
                chrome.runtime.sendMessage({
                    type: "fetchDeeds",
                    deedNumbers: deedNumbers,
                    ownerIdType: ownerIdType,
                    ownerId: ownerId
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Send error response back to the requesting origin only
                        const requestInfo = pendingRequests.get(requestId);
                        const targetOrigin = requestInfo?.origin || "*";

                        window.postMessage({
                            type: "SREM_BRIDGE_RESPONSE",
                            requestId: requestId,
                            success: false,
                            result: [],
                            error: "Extension context invalidated. Please reload the page.",
                            authStatus: "error"
                        }, targetOrigin);

                        // Clean up stored request
                        pendingRequests.delete(requestId);
                    } else {

                        // Send response back to the requesting origin only
                        const requestInfo = pendingRequests.get(requestId);
                        const targetOrigin = requestInfo?.origin || "*";

                        window.postMessage({
                            type: "SREM_BRIDGE_RESPONSE",
                            requestId: requestId,
                            success: response?.success || false,
                            result: response?.results || [],
                            error: response?.error || null,
                            authStatus: response?.authStatus || "unknown"
                        }, targetOrigin);

                        // Clean up stored request
                        pendingRequests.delete(requestId);
                    }
                });
            });
        } else {
            // Extension context not available
            const requestInfo = pendingRequests.get(requestId);
            const targetOrigin = requestInfo?.origin || "*";

            window.postMessage({
                type: "SREM_BRIDGE_RESPONSE",
                requestId: requestId,
                success: false,
                results: [],
                error: "Extension context not available. Please reload the page.",
                authStatus: "error"
            }, targetOrigin);

            // Clean up stored request
            pendingRequests.delete(requestId);
        }
    }

    // Handle authentication status requests
    function handleAuthStatusRequest(event) {
        const { requestId } = event.data;



        try {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: "getAuthStatus"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        window.postMessage({
                            type: "SREM_AUTH_STATUS_RESPONSE",
                            requestId: requestId,
                            authenticated: false,
                            status: "error",
                            message: "Extension context invalidated. Please reload the page."
                        }, "*");
                    } else {

                        window.postMessage({
                            type: "SREM_AUTH_STATUS_RESPONSE",
                            requestId: requestId,
                            authenticated: response?.authenticated || false,
                            status: response?.status || "unknown",
                            message: response?.message || "Unknown status"
                        }, "*");
                    }
                });
            } else {
                window.postMessage({
                    type: "SREM_AUTH_STATUS_RESPONSE",
                    requestId: requestId,
                    authenticated: false,
                    status: "error",
                    message: "Extension context not available. Please reload the page."
                }, "*");
            }
        } catch (error) {
            window.postMessage({
                type: "SREM_AUTH_STATUS_RESPONSE",
                requestId: requestId,
                authenticated: false,
                status: "error",
                message: "Extension error. Please reload the page."
            }, "*");
        }
    }

    // Bridge ready notification removed - extension stays hidden until approved
    // Domains must ping to discover extension and get approval
})();
