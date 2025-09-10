/*
 * SREM.sa Real Estate Deeds Bridge - Request Builder
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Centralized request building and validation to ensure consistent
 * parameter handling across all components and prevent .trim() crashes
 */

/**
 * Centralized request builder for consistent parameter validation and request building
 * Prevents .trim() crashes and ensures all components handle parameters consistently
 */
const RequestBuilder = {
  /**
   * Extract all possible parameters from event data or message
   * Safely handles missing parameters without crashes
   *
   * @param {Object} eventData - Raw event data or message object
   * @returns {Object} Complete parameter object with safe defaults
   */
  extractAllParameters(eventData) {
    const {
      requestId,
      deedNumbers,
      searchMode,
      ownerIdType,
      ownerId,
      deedDateYear,
      deedDateMonth,
      deedDateDay,
      isHijriDate,
      timestamp
    } = eventData || {};

    return {
      requestId: this._safeString(requestId),
      deedNumbers: this._safeString(deedNumbers),
      searchMode: this._safeString(searchMode, 'owner'), // Default to 'owner'
      ownerIdType: this._safeNumber(ownerIdType, 1), // Default to 1 (National ID)
      ownerId: this._safeString(ownerId),
      deedDateYear: this._safeNumber(deedDateYear),
      deedDateMonth: this._safeNumber(deedDateMonth),
      deedDateDay: this._safeNumber(deedDateDay),
      isHijriDate: Boolean(isHijriDate),
      timestamp: this._safeNumber(timestamp, Date.now())
    };
  },

  /**
   * Validate and build a complete request object
   * Performs comprehensive validation for both owner and date searches
   *
   * @param {Object} rawParams - Raw parameters from extractAllParameters
   * @returns {Object} Validation result with success flag and validated data or errors
   */
  validateAndBuildRequest(rawParams) {
    const params = this.extractAllParameters(rawParams);
    const errors = [];

    // Validate required common parameters
    if (!params.deedNumbers || params.deedNumbers.trim() === '') {
      errors.push('Deed numbers are required');
    }

    if (!params.requestId || params.requestId.trim() === '') {
      errors.push('Request ID is required');
    }

    // Validate search mode
    if (!['owner', 'date'].includes(params.searchMode)) {
      errors.push('Search mode must be either "owner" or "date"');
    }

    // Mode-specific validation
    if (params.searchMode === 'owner') {
      if (!params.ownerId || params.ownerId.trim() === '') {
        errors.push('Owner ID is required for owner search');
      }
      if (![1, 2, 5].includes(params.ownerIdType)) {
        errors.push('Owner ID type must be 1 (National), 2 (Iqama), or 5 (Commercial)');
      }
    } else if (params.searchMode === 'date') {
      if (!params.deedDateYear || params.deedDateYear < 1900 || params.deedDateYear > 2100) {
        errors.push('Valid deed date year is required for date search');
      }
      if (!params.deedDateMonth || params.deedDateMonth < 1 || params.deedDateMonth > 12) {
        errors.push('Valid deed date month (1-12) is required for date search');
      }
      if (!params.deedDateDay || params.deedDateDay < 1 || params.deedDateDay > 31) {
        errors.push('Valid deed date day (1-31) is required for date search');
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors: errors,
        data: null
      };
    }

    return {
      success: true,
      errors: [],
      data: params
    };
  },

  /**
   * Build API payload for SREM backend
   * Creates the appropriate payload structure for owner or date searches
   *
   * @param {Object} validatedRequest - Validated request from validateAndBuildRequest
   * @param {string} deedNumber - Individual deed number being processed
   * @returns {Object} API payload ready for fetch request
   */
  buildApiPayload(validatedRequest, deedNumber) {
    const params = validatedRequest.data;

    if (params.searchMode === 'date') {
      return {
        apiUrl: "https://prod-inquiryservice-srem.moj.gov.sa/api/v1/DeedInquiry/GetDeedByNumber",
        payload: {
          deedNumber: this._safeString(deedNumber).trim(),
          deedDateYear: parseInt(params.deedDateYear),
          deedDateMonth: parseInt(params.deedDateMonth),
          deedDateDay: parseInt(params.deedDateDay),
          isHijriDate: params.isHijriDate
        }
      };
    } else {
      return {
        apiUrl: "https://prod-inquiryservice-srem.moj.gov.sa/api/v1/DeedInquiry/GetDeedByOwner",
        payload: {
          deedNumber: this._safeString(deedNumber).trim(),
          idType: parseInt(params.ownerIdType),
          idNumber: this._safeString(params.ownerId).trim()
        }
      };
    }
  },

  /**
   * Build message for chrome.runtime.sendMessage
   * Creates consistent message structure for internal communication
   *
   * @param {Object} validatedRequest - Validated request from validateAndBuildRequest
   * @returns {Object} Message object for chrome.runtime.sendMessage
   */
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

  /**
   * Parse deed numbers from string input
   * Handles various separators and filters empty values
   *
   * @param {string} deedNumbersString - Comma/semicolon/space separated deed numbers
   * @returns {Array} Array of clean deed number strings
   */
  parseDeedNumbers(deedNumbersString) {
    if (!deedNumbersString || typeof deedNumbersString !== 'string') {
      return [];
    }

    return deedNumbersString
      .split(/[,;\s:\n\r]+/)
      .map(num => this._safeString(num).trim())
      .filter(num => num.length > 0);
  },

  /**
   * Safely convert value to string with optional default
   * @private
   */
  _safeString(value, defaultValue = '') {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return String(value);
  },

  /**
   * Safely convert value to number with optional default
   * @private
   */
  _safeNumber(value, defaultValue = null) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RequestBuilder;
}
