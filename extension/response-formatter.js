/*
 * SREM.sa Real Estate Deeds Bridge - Response Formatter
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Centralized response formatting to ensure consistent JSON structure
 * across all outputs (downloads, Bridge API, internal responses)
 */

/**
 * Centralized response formatter for consistent JSON structure
 * Ensures all outputs use the same 'result' field with raw SREM data
 */
const ResponseFormatter = {
  /**
   * Format deed data for downloads and core data responses
   * Always returns raw SREM data in result field - no wrapper layers
   * 
   * @param {Array} sremResults - Array of {deedNumber, success, data, error} objects
   * @returns {Object} Standardized response with result field containing raw SREM data
   */
  formatDataResponse(sremResults) {
    const successfulResults = sremResults.filter(r => r.success && r.data);
    
    return {
      result: successfulResults.map(r => r.data) // Raw SREM API response
    };
  },

  /**
   * Format Bridge API response with metadata wrapper
   * Uses same result field as downloads + additional Bridge API metadata
   * 
   * @param {string} requestId - Unique request identifier
   * @param {Array} sremResults - Array of {deedNumber, success, data, error} objects
   * @param {string} authStatus - Authentication status
   * @returns {Object} Bridge API response with consistent result field
   */
  formatBridgeResponse(requestId, sremResults, authStatus = "authenticated") {
    const successfulResults = sremResults.filter(r => r.success && r.data);
    const failedResults = sremResults.filter(r => !r.success);
    const overallSuccess = successfulResults.length > 0;
    
    return {
      type: "SREM_BRIDGE_RESPONSE",
      requestId: requestId,
      success: overallSuccess,
      result: successfulResults.map(r => r.data), // Same as formatDataResponse
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

  /**
   * Format error response for Bridge API
   * 
   * @param {string} requestId - Unique request identifier
   * @param {string} error - Error message
   * @param {string} authStatus - Authentication status
   * @returns {Object} Bridge API error response
   */
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

  /**
   * Format background script response for internal communication
   * 
   * @param {Array} sremResults - Array of {deedNumber, success, data, error} objects
   * @param {string} authStatus - Authentication status
   * @returns {Object} Internal response format
   */
  formatInternalResponse(sremResults, authStatus = "authenticated") {
    const successfulResults = sremResults.filter(r => r.success);
    
    return {
      success: successfulResults.length > 0,
      results: sremResults, // Keep individual result tracking for internal use
      authStatus: authStatus,
      totalRequested: sremResults.length,
      totalSuccessful: successfulResults.length
    };
  },

  /**
   * Build error message from failed results
   * @private
   */
  _buildErrorMessage(failedResults) {
    if (failedResults.length === 0) return null;
    if (failedResults.length === 1) return failedResults[0].error;
    return `${failedResults.length} deeds failed. First error: ${failedResults[0].error}`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponseFormatter;
}
