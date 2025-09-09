# Changelog

All notable changes to the SREM.sa Real Estate Deeds Bridge extension.

## [1.1.1] - 2025-01-09

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

## [1.1.0] - 2025-01-09

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
