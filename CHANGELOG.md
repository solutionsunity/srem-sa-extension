# Changelog

All notable changes to the SREM.sa Real Estate Deeds Bridge extension.

## [1.2.1] - 2025-09-10

### 🐛 Bug Fixes
- **Fixed**: Approval message port error when external apps are approved
- **Resolved**: "The message port closed before a response was received" console error
- **Enhanced**: Proper response handling in domain approval flow

### 🔧 Technical Improvements
- **Refactored**: Domain approval message handling with global tracking
- **Added**: handleDomainApprovalResponse function with proper sendResponse()
- **Improved**: Error handling in approval.js with better logging

## [1.2.0] - 2025-09-10

### 🏗️ Major Architecture Improvements - DRY Compliance
- **Eliminated Code Duplication**: Removed 300+ lines of duplicated code across components
- **Centralized Utilities**: Created 5 new utility modules for consistent functionality
- **Enhanced Reliability**: Improved error handling with timeout and retry mechanisms
- **Better Maintainability**: Single source of truth for all request/response operations

### 🔧 New Centralized Utilities
- **`shared-utils.js`**: Consolidated RequestBuilder and ResponseFormatter for content scripts
- **`auth-response-builder.js`**: Centralized authentication response patterns
- **`chrome-runtime-helper.js`**: Safe Chrome runtime operations with error recovery
- **Enhanced `request-builder.js`**: Improved parameter validation and API payload building
- **Enhanced `response-formatter.js`**: Consistent response formatting across all components

### 🐛 Bug Fixes
- **Fixed Original Issue**: Resolved `.trim()` crash when `ownerId` parameter missing for date searches
- **Fixed**: Date search functionality now working correctly with proper API endpoints
- **Enhanced**: Separate date input widgets for Gregorian vs Hijri calendars
- **Improved**: Error handling with consistent messages and recovery patterns
- **Resolved**: Script loading conflicts and duplicate declarations

### 🔧 Technical Improvements
- **DRY Compliance**: Eliminated all code duplication with centralized utilities
- **Enhanced**: Automatic auth status broadcasting with real-time updates
- **Optimized**: Static imports for better performance and reliability

### 🎨 UX Improvements
- **Enhanced**: Search button now disabled when service is not connected
- **Improved**: Clear visual feedback with disabled button styling and helpful text
- **Added**: Tooltip guidance when authentication is required

### 🔄 Migration Notes
- **No Breaking Changes**: All existing functionality preserved
- **Enhanced APIs**: New utilities provide more robust error handling
- **Backward Compatible**: External API unchanged, only internal improvements

## [1.1.5] - 2025-09-10

### 🔧 Fixed
- **JSON Response Structure**: Fixed inconsistent response format between downloads and Bridge API
- **Data Access Path**: Eliminated extra wrapper layer causing `data.Data` vs `Data` confusion
- **Response Consistency**: All outputs now use same `result` field with raw SREM data

### 🏗️ Architecture
- **Centralized Formatter**: Added `response-formatter.js` utility for consistent JSON structure
- **DRY Principle**: Single source of truth for all response formatting
- **Updated Documentation**: API examples now reflect consistent format

### 🐛 Bug Details
- **Issue**: Bridge API wrapped SREM data in extra layer: `result[0].data.Data.DeedNo`
- **Root Cause**: Multiple response formatting locations without coordination
- **Solution**: Centralized response builder ensuring consistent `result[0].Data.DeedNo` access

## [1.1.4] - 2025-09-09

### 🔧 Fixed
- **Domain Removal**: Fixed "×" button in popup not working to remove approved domains
- **CSP Compliance**: Replaced inline onclick handlers with proper event listeners
- **Popup Functionality**: Domain removal buttons now work correctly

### 🐛 Bug Details
- **Issue**: Remove domain buttons (×) were using inline onclick handlers
- **Root Cause**: Content Security Policy blocked inline event handlers
- **Solution**: Replaced with data attributes and addEventListener

## [1.1.3] - 2025-09-09

### 🔧 Fixed
- **Race Condition**: Fixed approval popup always returning "popup_closed"
- **Message Timing**: Use callback to ensure message is sent before closing window
- **User Actions**: Approve/Deny buttons now work correctly

### 🐛 Bug Details
- **Issue**: Window close event fired before approval message was processed
- **Root Cause**: `window.close()` called immediately after `sendMessage()`
- **Solution**: Use sendMessage callback to delay window closure

## [1.1.2] - 2025-09-09

### 🔧 Fixed
- **Approval Popup Timeout**: Added 30-second timeout for approval requests
- **Window Close Handling**: Properly handle when user closes approval popup
- **Missing Permission**: Added "windows" permission for popup creation
- **Promise Resolution**: Fixed hanging approval requests

### 🛠️ Improvements
- **Better Error Handling**: More specific error reasons (timeout, popup_closed, etc.)
- **Resource Cleanup**: Proper cleanup of event listeners and timeouts
- **User Experience**: Approval requests now always resolve within 30 seconds

## [1.1.1] - 2025-09-09

### 🔧 Fixed
- **JSON Output Consistency**: Unified Bridge API to use `result` field (same as downloads)
- **Icon Updates**: Generated fresh extension icons from v1.1 design
- **Developer Experience**: Same parsing logic now works for downloads and API responses

### 🌐 API Changes
- **CHANGED**: `SREM_BRIDGE_RESPONSE` now uses `result` instead of `results`
- **IMPROVED**: Consistent schema across all deed data outputs
- **UPDATED**: JavaScript library and demo files to use unified field name

### 📚 Documentation
- **UPDATED**: API documentation with unified schema examples
- **IMPROVED**: Developer examples showing consistent parsing logic

## [1.1.0] - 2025-09-09

### 🔐 Security & Privacy Enhancements
- **NEW**: Domain approval system with 60-day expiry
- **NEW**: Public API for extension discovery and approval requests
- **NEW**: Minimalist approval popup (430x370px)
- **IMPROVED**: Protected API requires domain approval
- **IMPROVED**: Enhanced security with domain whitelisting

### 🌐 API Changes
- **NEW**: `SREM_EXTENSION_DISCOVERY` - Check if extension exists (Public)
- **NEW**: `SREM_REQUEST_APPROVAL` - Request domain approval (Public)
- **NEW**: `SREM_APPROVAL_RESPONSE` - Approval result response
- **CHANGED**: `SREM_BRIDGE_REQUEST` now requires domain approval
- **CHANGED**: `SREM_AUTH_STATUS_REQUEST` now requires domain approval

### 🎨 User Interface
- **NEW**: Clean approval popup with app name and reason display
- **IMPROVED**: CSP-compliant popup (no inline event handlers)
- **IMPROVED**: Responsive popup design without scrollbars

### 📚 Documentation
- **NEW**: `API_REFERENCE.md` - Complete API documentation
- **UPDATED**: `README.md` - Simplified for quick start
- **UPDATED**: Demo files with approval flow testing

### 🔧 Technical Improvements
- **IMPROVED**: Background script domain management
- **IMPROVED**: Content script message handling
- **REMOVED**: Debug console.log statements for production
- **FIXED**: CSP violations in approval popup

## [1.0.0] - 2025-09-07

### Added
- OIDC authentication with SREM.sa
- Dual search modes: Owner ID and Date-based deed search
- Bulk deed processing with flexible separators
- JSON export (individual and bulk)
- Bridge API for external applications
- Arabic RTL interface
- Privacy-focused, domain-specific operation

### Technical
- Manifest V3 compliance
- 695 lines of minimalist code
- Real-time token expiration detection

---
© 2025 Solutions Unity Co.
