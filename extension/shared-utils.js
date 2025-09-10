/*
 * SREM.sa Real Estate Deeds Bridge - Shared Utilities
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Centralized utilities to eliminate DRY violations
 * This file combines RequestBuilder, ResponseFormatter, and other utilities
 */

// Import the main utilities and re-export them
// This approach works better for content scripts than ES6 modules

// Prevent duplicate declarations with IIFE guard
(function() {
  'use strict';

  // Check if already loaded
  if (typeof window !== 'undefined' && window.RequestBuilder) {
    return; // Already loaded
  }
  if (typeof self !== 'undefined' && self.RequestBuilder) {
    return; // Already loaded in service worker
  }

// Define RequestId utility for centralized ID generation
const RequestIdGenerator = {
  /**
   * Generate a unique request ID with context prefix
   * @param {string} context - Context identifier (e.g., 'bridge', 'fullpage', 'auth')
   * @returns {string} Unique request ID
   */
  generate(context = 'request') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${context}_${timestamp}_${random}`;
  },

  /**
   * Generate request ID for bridge requests
   * @returns {string} Bridge request ID
   */
  forBridge() {
    return this.generate('bridge');
  },

  /**
   * Generate request ID for fullpage requests
   * @returns {string} Fullpage request ID
   */
  forFullpage() {
    return this.generate('fullpage');
  },

  /**
   * Generate request ID for auth requests
   * @returns {string} Auth request ID
   */
  forAuth() {
    return this.generate('auth');
  },

  /**
   * Generate request ID for search requests
   * @returns {string} Search request ID
   */
  forSearch() {
    return this.generate('search');
  }
};

// Define DateFormatter utility for centralized date formatting
const DateFormatter = {
  /**
   * Format date components as zero-padded strings
   * @param {number|string} year - Year value
   * @param {number|string} month - Month value (1-12)
   * @param {number|string} day - Day value (1-31)
   * @returns {Object} Zero-padded date components
   */
  formatDateComponents(year, month, day) {
    return {
      deedDateYear: String(year).padStart(4, '0'),
      deedDateMonth: String(month).padStart(2, '0'),
      deedDateDay: String(day).padStart(2, '0')
    };
  },

  /**
   * Format HTML5 date input to zero-padded components
   * @param {string} dateValue - HTML5 date input value (YYYY-MM-DD)
   * @returns {Object} Zero-padded date components
   */
  formatGregorianDate(dateValue) {
    const date = new Date(dateValue);
    return this.formatDateComponents(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  },

  /**
   * Format manual date inputs to zero-padded components
   * @param {number|string} year - Year input value
   * @param {number|string} month - Month input value
   * @param {number|string} day - Day input value
   * @returns {Object} Zero-padded date components
   */
  formatManualDate(year, month, day) {
    return this.formatDateComponents(year, month, day);
  }
};

// SREM API Configuration
const SREM_API = {
  BASE_URL: "https://prod-inquiryservice-srem.moj.gov.sa",
  ENDPOINTS: {
    DEED_BY_OWNER: "/api/v1/DeedInquiry/GetDeedByOwner",
    DEED_BY_NUMBER: "/api/v1/DeedInquiry/GetDeedByNumber"
  },

  // Get URL for owner-based deed search
  getDeedByOwnerUrl() {
    return this.BASE_URL + this.ENDPOINTS.DEED_BY_OWNER;
  },

  // Get URL for date-based deed search
  getDeedByNumberUrl() {
    return this.BASE_URL + this.ENDPOINTS.DEED_BY_NUMBER;
  }
};

// Define RequestBuilder utility
const RequestBuilder = {
    extractAllParameters(eventData) {
      const {
        requestId, deedNumbers, searchMode, ownerIdType, ownerId,
        deedDateYear, deedDateMonth, deedDateDay, isHijriDate, timestamp
      } = eventData || {};

      return {
        requestId: this._safeString(requestId),
        deedNumbers: this._safeString(deedNumbers),
        searchMode: this._safeString(searchMode, 'owner'),
        ownerIdType: this._safeNumber(ownerIdType, 1),
        ownerId: this._safeString(ownerId),
        deedDateYear: this._safeString(deedDateYear),
        deedDateMonth: this._safeString(deedDateMonth),
        deedDateDay: this._safeString(deedDateDay),
        isHijriDate: Boolean(isHijriDate),
        timestamp: this._safeNumber(timestamp, Date.now())
      };
    },

    validateAndBuildRequest(rawParams) {
      const params = this.extractAllParameters(rawParams);
      const errors = [];

      if (!params.deedNumbers || params.deedNumbers.trim() === '') {
        errors.push('Deed numbers are required');
      }

      if (!params.requestId || params.requestId.trim() === '') {
        errors.push('Request ID is required');
      }

      if (!['owner', 'date'].includes(params.searchMode)) {
        errors.push('Search mode must be either "owner" or "date"');
      }

      if (params.searchMode === 'owner') {
        if (!params.ownerId || params.ownerId.trim() === '') {
          errors.push('Owner ID is required for owner search');
        }
        if (![1, 2, 5].includes(params.ownerIdType)) {
          errors.push('Owner ID type must be 1 (National), 2 (Iqama), or 5 (Commercial)');
        }
      } else if (params.searchMode === 'date') {
        const year = parseInt(params.deedDateYear);
        const month = parseInt(params.deedDateMonth);
        const day = parseInt(params.deedDateDay);
        const isHijri = Boolean(params.isHijriDate);

        // Year validation: different ranges for Hijri vs Gregorian
        if (!params.deedDateYear || isNaN(year)) {
          errors.push('Valid deed date year is required for date search');
        } else if (isHijri && (year < 1400 || year > 1500)) {
          errors.push('Valid Hijri year (1400-1500) is required for Hijri date search');
        } else if (!isHijri && (year < 1900 || year > 2100)) {
          errors.push('Valid Gregorian year (1900-2100) is required for Gregorian date search');
        }

        if (!params.deedDateMonth || isNaN(month) || month < 1 || month > 12) {
          errors.push('Valid deed date month (1-12) is required for date search');
        }
        if (!params.deedDateDay || isNaN(day) || day < 1 || day > 31) {
          errors.push('Valid deed date day (1-31) is required for date search');
        }
      }

      if (errors.length > 0) {
        return { success: false, errors: errors, data: null };
      }

      return { success: true, errors: [], data: params };
    },

    buildApiPayload(validatedRequest, deedNumber) {
      const params = validatedRequest.data;

      if (params.searchMode === 'date') {
        return {
          apiUrl: SREM_API.getDeedByNumberUrl(),
          payload: {
            deedNumber: this._safeString(deedNumber).trim(),
            deedDateYear: parseInt(params.deedDateYear),
            deedDateMonth: parseInt(params.deedDateMonth),
            deedDateDay: parseInt(params.deedDateDay),
            isHijriDate: Boolean(params.isHijriDate)
          }
        };
      } else {
        return {
          apiUrl: SREM_API.getDeedByOwnerUrl(),
          payload: {
            deedNumber: this._safeString(deedNumber).trim(),
            idType: parseInt(params.ownerIdType),
            idNumber: this._safeString(params.ownerId).trim()
          }
        };
      }
    },

    buildInternalMessage(validatedRequest) {
      const params = validatedRequest.data;

      return {
        type: "fetchDeeds",
        deedNumbers: params.deedNumbers,
        searchMode: params.searchMode,
        ownerIdType: params.ownerIdType,
        ownerId: params.ownerId,
        deedDateYear: params.deedDateYear,
        deedDateMonth: params.deedDateMonth,
        deedDateDay: params.deedDateDay,
        isHijriDate: params.isHijriDate
      };
    },

    parseDeedNumbers(deedNumbersString) {
      if (!deedNumbersString || typeof deedNumbersString !== 'string') {
        return [];
      }

      return deedNumbersString
        .split(/[,;\s:\n\r]+/)
        .map(num => this._safeString(num).trim())
        .filter(num => num.length > 0);
    },

    _safeString(value, defaultValue = '') {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      return String(value);
    },

    _safeNumber(value, defaultValue = null) {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    },

    /**
     * Convert number to zero-padded string (for date components)
     * @param {number|string} value - The value to pad
     * @param {number} length - Target length (default: 2)
     * @returns {string} Zero-padded string
     */
    _zeroPad(value, length = 2) {
      return String(value).padStart(length, '0');
    }
};

// ResponseFormatter utility
const ResponseFormatter = {
  formatDataResponse(sremResults) {
    const successfulResults = sremResults.filter(r => r.success && r.data);
    return {
      result: successfulResults.map(r => r.data)
    };
  },

  formatBridgeResponse(requestId, sremResults, authStatus = "authenticated") {
    const successfulResults = sremResults.filter(r => r.success && r.data);
    const failedResults = sremResults.filter(r => !r.success);
    const overallSuccess = successfulResults.length > 0;

    return {
      type: "SREM_BRIDGE_RESPONSE",
      requestId: requestId,
      success: overallSuccess,
      result: successfulResults.map(r => r.data),
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

  formatInternalResponse(sremResults, authStatus = "authenticated") {
    const successfulResults = sremResults.filter(r => r.success);
    const failedResults = sremResults.filter(r => !r.success);
    const overallSuccess = successfulResults.length > 0;

    return {
      success: overallSuccess,
      results: sremResults,
      error: overallSuccess ? null : this._buildErrorMessage(failedResults),
      authStatus: authStatus,
      totalRequested: sremResults.length,
      totalSuccessful: successfulResults.length
    };
  },

  _buildErrorMessage(failedResults) {
    if (failedResults.length === 0) return null;
    if (failedResults.length === 1) return failedResults[0].error;
    return `${failedResults.length} deeds failed. First error: ${failedResults[0].error}`;
  }
};

// Make utilities available globally in all contexts
if (typeof window !== 'undefined') {
  // Browser/content script context
  window.SREM_API = SREM_API;
  window.RequestIdGenerator = RequestIdGenerator;
  window.DateFormatter = DateFormatter;
  window.RequestBuilder = RequestBuilder;
  window.ResponseFormatter = ResponseFormatter;
} else if (typeof self !== 'undefined') {
  // Service worker context
  self.SREM_API = SREM_API;
  self.RequestIdGenerator = RequestIdGenerator;
  self.DateFormatter = DateFormatter;
  self.RequestBuilder = RequestBuilder;
  self.ResponseFormatter = ResponseFormatter;
} else if (typeof global !== 'undefined') {
  // Node.js context (for testing)
  global.SREM_API = SREM_API;
  global.RequestIdGenerator = RequestIdGenerator;
  global.DateFormatter = DateFormatter;
  global.RequestBuilder = RequestBuilder;
  global.ResponseFormatter = ResponseFormatter;
}

})(); // End IIFE
