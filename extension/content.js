/*
 * SREM.sa Real Estate Deeds Bridge - Content Script
 *
 * Copyright (c) 2025 Solutions Unity Co.
 * Website: https://solutionsunity.com
 *
 * Privacy-focused SREM deed data extraction with secure token management
 */

// Only run on SREM domain
if (window.location.hostname.includes('srem.moj.gov.sa')) {
  console.log('SREM Bridge content script loaded');
}
