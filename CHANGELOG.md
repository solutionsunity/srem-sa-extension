# Changelog

All notable changes to the SREM.sa Real Estate Deeds Bridge extension.

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
