/*
 * SREM.sa Real Estate Deeds Bridge - Chrome Runtime Helper
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Centralized Chrome runtime operations to eliminate DRY violations
 */

/**
 * Centralized Chrome runtime helper
 * Provides consistent error handling for chrome.runtime operations
 */
const ChromeRuntimeHelper = {
  /**
   * Send message with consistent error handling
   * @param {Object} message - Message to send
   * @param {Function} callback - Callback function (response, error) => {}
   * @param {number} timeout - Timeout in milliseconds (default: 10000)
   */
  sendMessageSafely(message, callback, timeout = 10000) {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      callback(null, { 
        type: 'EXTENSION_ERROR', 
        message: 'Extension context not available. Please reload the page.' 
      });
      return;
    }

    let timeoutId;
    let responded = false;

    // Set up timeout
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        if (!responded) {
          responded = true;
          callback(null, { 
            type: 'TIMEOUT_ERROR', 
            message: `Request timeout after ${timeout}ms` 
          });
        }
      }, timeout);
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (responded) return; // Already handled by timeout
        responded = true;
        
        if (timeoutId) clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          callback(null, {
            type: 'CHROME_ERROR',
            message: chrome.runtime.lastError.message,
            originalError: chrome.runtime.lastError
          });
        } else {
          callback(response, null);
        }
      });
    } catch (error) {
      if (responded) return;
      responded = true;
      
      if (timeoutId) clearTimeout(timeoutId);
      
      callback(null, {
        type: 'EXCEPTION_ERROR',
        message: error.message,
        originalError: error
      });
    }
  },

  /**
   * Send message and return a Promise
   * @param {Object} message - Message to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Promise that resolves with response or rejects with error
   */
  sendMessageAsync(message, timeout = 10000) {
    return new Promise((resolve, reject) => {
      this.sendMessageSafely(message, (response, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }, timeout);
    });
  },

  /**
   * Check if extension context is valid
   * @returns {boolean} True if extension context is available
   */
  isContextValid() {
    try {
      return !!(chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  },

  /**
   * Get extension context status
   * @returns {Object} Status object with details
   */
  getContextStatus() {
    try {
      const hasRuntime = !!(chrome && chrome.runtime);
      const hasId = hasRuntime && !!chrome.runtime.id;
      const canSendMessage = hasRuntime && typeof chrome.runtime.sendMessage === 'function';

      return {
        valid: hasRuntime && hasId && canSendMessage,
        hasRuntime,
        hasId,
        canSendMessage,
        extensionId: hasId ? chrome.runtime.id : null
      };
    } catch (error) {
      return {
        valid: false,
        hasRuntime: false,
        hasId: false,
        canSendMessage: false,
        extensionId: null,
        error: error.message
      };
    }
  },

  /**
   * Send message with automatic retry on context errors
   * @param {Object} message - Message to send
   * @param {Function} callback - Callback function
   * @param {Object} options - Options { timeout, maxRetries, retryDelay }
   */
  sendMessageWithRetry(message, callback, options = {}) {
    const {
      timeout = 10000,
      maxRetries = 2,
      retryDelay = 1000
    } = options;

    let attempts = 0;

    const attemptSend = () => {
      attempts++;
      
      this.sendMessageSafely(message, (response, error) => {
        if (error && error.type === 'CHROME_ERROR' && attempts < maxRetries) {
          // Retry on Chrome runtime errors
          setTimeout(attemptSend, retryDelay);
        } else {
          callback(response, error);
        }
      }, timeout);
    };

    attemptSend();
  },

  /**
   * Batch send multiple messages
   * @param {Array} messages - Array of message objects
   * @param {Function} callback - Callback with (results, errors) => {}
   * @param {number} timeout - Timeout per message
   */
  sendMessagesBatch(messages, callback, timeout = 10000) {
    const results = [];
    const errors = [];
    let completed = 0;

    if (messages.length === 0) {
      callback([], []);
      return;
    }

    messages.forEach((message, index) => {
      this.sendMessageSafely(message, (response, error) => {
        if (error) {
          errors.push({ index, message, error });
        } else {
          results.push({ index, message, response });
        }

        completed++;
        if (completed === messages.length) {
          callback(results, errors);
        }
      }, timeout);
    });
  },

  /**
   * Create a safe callback wrapper that handles common error patterns
   * @param {Function} originalCallback - Original callback function
   * @param {Object} options - Options for error handling
   * @returns {Function} Wrapped callback function
   */
  createSafeCallback(originalCallback, options = {}) {
    const {
      defaultResponse = null,
      logErrors = true,
      errorPrefix = 'ChromeRuntimeHelper'
    } = options;

    return (response, error) => {
      if (error) {
        if (logErrors) {
          console.error(`${errorPrefix}:`, error);
        }
        originalCallback(defaultResponse, error);
      } else {
        originalCallback(response, null);
      }
    };
  },

  /**
   * Check if error is recoverable (worth retrying)
   * @param {Object} error - Error object
   * @returns {boolean} True if error might be recoverable
   */
  isRecoverableError(error) {
    if (!error) return false;
    
    const recoverableTypes = ['CHROME_ERROR', 'TIMEOUT_ERROR'];
    const recoverableMessages = [
      'Extension context invalidated',
      'Could not establish connection',
      'The message port closed before a response was received'
    ];

    return recoverableTypes.includes(error.type) ||
           recoverableMessages.some(msg => error.message && error.message.includes(msg));
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChromeRuntimeHelper;
}

// Make globally available for content scripts
if (typeof window !== 'undefined') {
  window.ChromeRuntimeHelper = ChromeRuntimeHelper;
}
