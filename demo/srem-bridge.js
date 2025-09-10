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
   * Generate a unique request ID with context prefix
   * @param {string} context - Context identifier (e.g., 'auth', 'search')
   * @returns {string} Unique request ID
   * @private
   */
  _generateRequestId(context = 'request') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${context}_${timestamp}_${random}`;
  }

  /**
   * Format date components as zero-padded strings
   * @param {number|string} year - Year value
   * @param {number|string} month - Month value (1-12)
   * @param {number|string} day - Day value (1-31)
   * @returns {Object} Zero-padded date components
   * @private
   */
  _formatDateComponents(year, month, day) {
    return {
      deedDateYear: String(year).padStart(4, '0'),
      deedDateMonth: String(month).padStart(2, '0'),
      deedDateDay: String(day).padStart(2, '0')
    };
  }

  /**
   * Check authentication status
   * @returns {Promise<{authenticated: boolean, status: string, message: string}>}
   */
  async getAuthStatus() {
    return new Promise((resolve) => {
      const requestId = this._generateRequestId('auth');
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
   * @param {Object} searchParams - Search parameters object
   * @param {number} searchParams.ownerIdType - 1 for Saudi ID, 2 for Iqama (for owner search)
   * @param {string} searchParams.ownerId - Owner ID number (for owner search)
   * @param {number} searchParams.deedDateYear - Year (for date search)
   * @param {number} searchParams.deedDateMonth - Month 1-12 (for date search)
   * @param {number} searchParams.deedDateDay - Day 1-31 (for date search)
   * @param {boolean} searchParams.isHijriDate - Whether date is Hijri (for date search)
   * @returns {Promise<{success: boolean, result: Array, error?: string}>}
   */
  async searchDeeds(deedNumbers, searchMode = 'owner', searchParams = {}) {
    return new Promise((resolve) => {
      const requestId = this._generateRequestId('search');
      const timeout = setTimeout(() => {
        resolve({ success: false, result: [], error: 'Request timeout' });
      }, 30000);

      const listener = (event) => {
        if (event.data.type === 'SREM_BRIDGE_RESPONSE' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);

          resolve({
            success: event.data.success,
            result: event.data.result || [],
            error: event.data.error,
            authStatus: event.data.authStatus
          });
        }
      };

      window.addEventListener('message', listener);

      // Build request with only required parameters for the search mode
      const request = {
        type: 'SREM_BRIDGE_REQUEST',
        requestId: requestId,
        deedNumbers: deedNumbers,
        searchMode: searchMode,
        timestamp: Date.now()
      };

      // Add ONLY the required parameters for each search mode
      if (searchMode === 'owner') {
        request.ownerIdType = searchParams.ownerIdType || 1;
        request.ownerId = searchParams.ownerId || '';
        // Do NOT send date parameters for owner search
      } else if (searchMode === 'date') {
        const dateComponents = this._formatDateComponents(
          searchParams.deedDateYear,
          searchParams.deedDateMonth,
          searchParams.deedDateDay
        );
        Object.assign(request, dateComponents);
        request.isHijriDate = searchParams.isHijriDate || false;
        // Do NOT send owner parameters for date search
      }

      window.postMessage(request, '*');
    });
  }

  /**
   * Search deeds by owner (convenience method)
   * @param {string} deedNumbers - Comma-separated deed numbers
   * @param {number} ownerIdType - 1 for Saudi ID, 2 for Iqama
   * @param {string} ownerId - Owner ID number
   * @returns {Promise<{success: boolean, result: Array, error?: string}>}
   */
  async searchDeedsByOwner(deedNumbers, ownerIdType = 1, ownerId = '') {
    return this.searchDeeds(deedNumbers, 'owner', { ownerIdType, ownerId });
  }

  /**
   * Search deeds by date (convenience method)
   * @param {string} deedNumbers - Comma-separated deed numbers
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} day - Day (1-31)
   * @param {boolean} isHijriDate - Whether date is Hijri calendar
   * @returns {Promise<{success: boolean, result: Array, error?: string}>}
   */
  async searchDeedsByDate(deedNumbers, year, month, day, isHijriDate = false) {
    return this.searchDeeds(deedNumbers, 'date', {
      deedDateYear: year,
      deedDateMonth: month,
      deedDateDay: day,
      isHijriDate: isHijriDate
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
