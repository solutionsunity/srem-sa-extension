// Bridge content script for external app integration
// This script runs on localhost and other specified domains to enable communication

// Check if extension context is valid before proceeding
(function () {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            console.log("Extension context invalidated, bridge content script will not initialize");
            return;
        }
        console.log('SREM Bridge content script loaded successfully');
    } catch (error) {
        console.log("Extension context invalidated during bridge initialization:", error.message);
        return;
    }

    // Notify that the bridge is ready
    function notifyBridgeReady() {
        try {
            const extensionId = chrome.runtime && chrome.runtime.id ? chrome.runtime.id : 'unknown';

            window.postMessage({
                type: "SREM_BRIDGE_READY",
                timestamp: Date.now(),
                extensionId: extensionId
            }, "*");

            // Set a global flag for simple detection
            window.SREM_BRIDGE_EXTENSION_AVAILABLE = true;
            console.log("SREM Bridge ready, extension ID:", extensionId);
        } catch (error) {
            console.log("Error notifying bridge ready:", error.message);
            // Still set the flag even if there's an error
            window.SREM_BRIDGE_EXTENSION_AVAILABLE = true;
        }
    }

    // Listen for messages from the web page
    window.addEventListener("message", (event) => {
        console.log('Bridge content script received message:', event.data);

        // Handle ping requests from web pages
        if (event.data.type === "SREM_EXTENSION_PING") {
            try {
                const extensionId = chrome.runtime && chrome.runtime.id ? chrome.runtime.id : 'unknown';
                // Respond with pong to confirm extension is available
                window.postMessage({
                    type: "SREM_EXTENSION_PONG",
                    timestamp: Date.now(),
                    extensionId: extensionId
                }, "*");
            } catch (error) {
                console.log("Error responding to ping:", error.message);
            }
        }

        // Handle external app requests for deed data
        if (event.data.type === "SREM_BRIDGE_REQUEST") {
            handleBridgeRequest(event);
        }

        // Handle authentication status requests
        if (event.data.type === "SREM_AUTH_STATUS_REQUEST") {
            handleAuthStatusRequest(event);
        }
    });

    // Handle bridge requests from external applications
    function handleBridgeRequest(event) {
        const { requestId, deedNumbers, ownerIdType, ownerId } = event.data;

        console.log('Handling bridge request:', { requestId, deedNumbers, ownerIdType, ownerId });

        try {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                // Forward to background script
                chrome.runtime.sendMessage({
                    type: "fetchDeeds",
                    deedNumbers: deedNumbers,
                    ownerIdType: ownerIdType,
                    ownerId: ownerId
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("Extension context invalidated during bridge request:", chrome.runtime.lastError.message);
                        // Send error response back to the web page
                        window.postMessage({
                            type: "SREM_BRIDGE_RESPONSE",
                            requestId: requestId,
                            success: false,
                            results: [],
                            error: "Extension context invalidated. Please reload the page.",
                            authStatus: "error"
                        }, "*");
                    } else {
                        console.log('Background script response:', response);

                        // Send response back to the web page
                        window.postMessage({
                            type: "SREM_BRIDGE_RESPONSE",
                            requestId: requestId,
                            success: response?.success || false,
                            results: response?.results || [],
                            data: response?.data || null,
                            error: response?.error || null,
                            authStatus: response?.authStatus || "unknown"
                        }, "*");
                    }
                });
            } else {
                // Extension context not available
                window.postMessage({
                    type: "SREM_BRIDGE_RESPONSE",
                    requestId: requestId,
                    success: false,
                    results: [],
                    error: "Extension context not available. Please reload the page.",
                    authStatus: "error"
                }, "*");
            }
        } catch (error) {
            console.log("Error in bridge request:", error.message);
            window.postMessage({
                type: "SREM_BRIDGE_RESPONSE",
                requestId: requestId,
                success: false,
                results: [],
                error: "Extension error. Please reload the page.",
                authStatus: "error"
            }, "*");
        }
    }

    // Handle authentication status requests
    function handleAuthStatusRequest(event) {
        const { requestId } = event.data;

        console.log('Handling auth status request:', requestId);

        try {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: "getAuthStatus"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("Extension context invalidated during auth status request:", chrome.runtime.lastError.message);
                        window.postMessage({
                            type: "SREM_AUTH_STATUS_RESPONSE",
                            requestId: requestId,
                            authenticated: false,
                            status: "error",
                            message: "Extension context invalidated. Please reload the page."
                        }, "*");
                    } else {
                        console.log('Auth status response:', response);

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
            console.log("Error in auth status request:", error.message);
            window.postMessage({
                type: "SREM_AUTH_STATUS_RESPONSE",
                requestId: requestId,
                authenticated: false,
                status: "error",
                message: "Extension error. Please reload the page."
            }, "*");
        }
    }

    // Initialize bridge when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', notifyBridgeReady);
    } else {
        notifyBridgeReady();
    }

    // Also notify after a short delay to ensure the page is fully loaded
    setTimeout(notifyBridgeReady, 1000);
})();
