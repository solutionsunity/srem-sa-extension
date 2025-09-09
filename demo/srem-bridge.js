/**
 * SREM Bridge JavaScript Library
 * Easy integration with SREM Extension
 * 
 * Usage:
 * const srem = new SremBridge('My App Name');
 * if (await srem.isAvailable()) {
 *   const approved = await srem.requestApproval('Need deed data for CRM');
 *   if (approved) {
 *     const data = await srem.searchDeeds('123456', 'owner', 1, '1234567890');
 *   }
 * }
 */

class SremBridge {
  constructor(appName = 'Unknown App') {
    this.appName = appName;
    this.extensionInfo = null;
    this.isApproved = false;
    this.listeners = new Map();
  }

  /**
   * Check if SREM extension is installed
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);

      const listener = (event) => {
        if (event.data.type === 'SREM_EXTENSION_EXISTS') {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          
          this.extensionInfo = {
            id: event.data.extensionId,
            version: event.data.version,
            name: event.data.name
          };
          
          resolve(true);
        }
      };

      window.addEventListener('message', listener);
      
      window.postMessage({
        type: 'SREM_EXTENSION_DISCOVERY',
        timestamp: Date.now()
      }, '*');
    });
  }

  /**
   * Request approval to use the extension
   * @param {string} reason - Why approval is needed
   * @returns {Promise<{approved: boolean, expiresAt?: string, reason: string}>}
   */
  async requestApproval(reason = 'Access SREM deed data') {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ approved: false, reason: 'timeout' });
      }, 30000); // 30 second timeout for user decision

      const listener = (event) => {
        if (event.data.type === 'SREM_APPROVAL_RESPONSE') {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          
          this.isApproved = event.data.approved;
          resolve({
            approved: event.data.approved,
            expiresAt: event.data.expiresAt,
            reason: event.data.reason
          });
        }
      };

      window.addEventListener('message', listener);
      
      window.postMessage({
        type: 'SREM_REQUEST_APPROVAL',
        appName: this.appName,
        reason: reason,
        timestamp: Date.now()
      }, '*');
    });
  }

  /**
   * Check authentication status
   * @returns {Promise<{authenticated: boolean, status: string, message: string}>}
   */
  async getAuthStatus() {
    return new Promise((resolve) => {
      const requestId = 'auth_' + Date.now();
      const timeout = setTimeout(() => {
        resolve({ authenticated: false, status: 'timeout', message: 'Request timeout' });
      }, 10000);

      const listener = (event) => {
        if (event.data.type === 'SREM_AUTH_STATUS_RESPONSE' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          
          resolve({
            authenticated: event.data.authenticated,
            status: event.data.status,
            message: event.data.message
          });
        }
      };

      window.addEventListener('message', listener);
      
      window.postMessage({
        type: 'SREM_AUTH_STATUS_REQUEST',
        requestId: requestId,
        timestamp: Date.now()
      }, '*');
    });
  }

  /**
   * Search for deed data
   * @param {string} deedNumbers - Comma-separated deed numbers
   * @param {string} searchMode - 'owner' or 'date'
   * @param {number} ownerIdType - 1 for Saudi ID, 2 for Iqama
   * @param {string} ownerId - Owner ID number
   * @returns {Promise<{success: boolean, results: Array, error?: string}>}
   */
  async searchDeeds(deedNumbers, searchMode = 'owner', ownerIdType = 1, ownerId = '') {
    return new Promise((resolve) => {
      const requestId = 'search_' + Date.now();
      const timeout = setTimeout(() => {
        resolve({ success: false, results: [], error: 'Request timeout' });
      }, 30000);

      const listener = (event) => {
        if (event.data.type === 'SREM_BRIDGE_RESPONSE' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          
          resolve({
            success: event.data.success,
            results: event.data.results || [],
            error: event.data.error,
            authStatus: event.data.authStatus
          });
        }
      };

      window.addEventListener('message', listener);
      
      window.postMessage({
        type: 'SREM_BRIDGE_REQUEST',
        requestId: requestId,
        deedNumbers: deedNumbers,
        searchMode: searchMode,
        ownerIdType: ownerIdType,
        ownerId: ownerId,
        timestamp: Date.now()
      }, '*');
    });
  }

  /**
   * Get extension information
   * @returns {object|null}
   */
  getExtensionInfo() {
    return this.extensionInfo;
  }

  /**
   * Check if domain is currently approved
   * @returns {boolean}
   */
  getApprovalStatus() {
    return this.isApproved;
  }

  /**
   * Initialize SREM Bridge with full flow
   * @param {string} reason - Reason for requesting approval
   * @returns {Promise<{ready: boolean, error?: string}>}
   */
  async initialize(reason = 'Access SREM deed data') {
    try {
      // Check if extension is available
      const available = await this.isAvailable();
      if (!available) {
        return { ready: false, error: 'Extension not installed' };
      }

      // Request approval
      const approval = await this.requestApproval(reason);
      if (!approval.approved) {
        return { ready: false, error: `Approval denied: ${approval.reason}` };
      }

      // Check authentication
      const auth = await this.getAuthStatus();
      if (!auth.authenticated) {
        return { ready: false, error: `Not authenticated: ${auth.message}` };
      }

      return { ready: true };
    } catch (error) {
      return { ready: false, error: error.message };
    }
  }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SremBridge;
} else {
  window.SremBridge = SremBridge;
}
