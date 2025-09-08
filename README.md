# SREM.sa Real Estate Deeds Bridge

A minimalist, privacy-focused Chrome extension for extracting real estate deed data from SREM.sa with secure OIDC token management.

## ⚠️ Important Disclaimer

**This application is developed by Solutions Unity Co. and has no official relation to the Ministry of Justice of Saudi Arabia or the SREM service.** This extension is a third-party tool designed to facilitate data extraction for legitimate users who are already authenticated with SREM.

**Arabic**: هذا التطبيق من تطوير شركة Solutions Unity وليس له علاقة رسمية بوزارة العدل السعودية أو البوصة العقارية. هذا الامتداد هو أداة طرف ثالث مصممة لتسهيل استخراج البيانات للمستخدمين المصرح لهم والذين سجلوا دخولهم بالفعل في البوصة العقارية.

## Copyright & Attribution

**Author:** Solutions Unity Co.
**Website:** [solutionsunity.com](https://solutionsunity.com)
**Copyright:** © 2025 Solutions Unity Co. All rights reserved.

## 🎯 Features

- **🔒 Privacy-First**: Only operates on SREM domain, no cross-site tracking
- **⚡ Minimalist Code**: Clean, bug-free implementation with minimal footprint
- **🔐 OIDC Authentication**: Uses SREM's native OIDC tokens for secure access
- **📊 Dual Search Modes**: Search by owner ID or deed date
- **💾 JSON Export**: Download individual or bulk deed data
- **🌐 Bridge API**: External application integration support

## 📁 Repository Structure

```
srem-sa-extension/
├── extension/           # Clean extension code (load this in Chrome)
│   ├── manifest.json    # Extension manifest
│   ├── background.js    # Service worker (150 lines)
│   ├── popup.html       # Popup interface
│   ├── popup.js         # Popup logic (50 lines)
│   ├── fullpage.html    # Full page interface
│   ├── fullpage.js      # Full page logic (200 lines)
│   ├── content.js       # Content script (10 lines)
│   ├── bridge_content.js # Bridge for external apps
│   ├── css/            # Stylesheets
│   ├── fonts/          # Arabic fonts
│   └── icons/          # Extension icons
├── demo/               # Demo files and examples
├── docs/               # Documentation
├── backup/             # Legacy code backup
└── README.md           # This file
```

## 🚀 Quick Start

### Installation
1. Download the `extension/` folder
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `extension/` folder
5. Login to [srem.moj.gov.sa](https://srem.moj.gov.sa)
6. Click extension icon → "فتح الصفحة الكاملة"

### Usage
1. **Owner Search**: Enter deed number(s) + owner ID
2. **Date Search**: Enter deed number(s) + deed date
3. **Multiple Deeds**: Separate with `,` `;` `:` or spaces
4. **Download**: Individual JSON or bulk export

## 🔧 Technical Highlights

### Minimalist Architecture
- **Background**: 150 lines - OIDC auth + API calls
- **Popup**: 50 lines - Status display + navigation
- **Full Page**: 200 lines - Search interface + results
- **Content**: 10 lines - Domain validation only
- **Total Core Code**: ~400 lines (excluding UI/CSS)

### OIDC Authentication
```javascript
// Direct localStorage token access
const oidcKey = 'oidc.user:https://sts-srem-sso.red.sa/:SREM.FrontEnd.Prod';
const oidcData = localStorage.getItem(oidcKey);
const token = JSON.parse(oidcData).access_token;
```

### API Integration
```javascript
// Clean API calls with proper error handling
const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});
```

## 🌐 Bridge API

### External App Integration
```javascript
// Ping extension
window.postMessage({ type: "SREM_EXTENSION_PING" }, "*");

// Request deed data
window.postMessage({
  type: "SREM_BRIDGE_REQUEST",
  requestId: Date.now().toString(),
  deedNumbers: "123456,789012",
  searchMode: "owner",
  ownerIdType: 1,
  ownerId: "1234567890"
}, "*");

// Listen for results
window.addEventListener("message", (event) => {
  if (event.data.type === "SREM_BRIDGE_RESPONSE") {
    console.log("Results:", event.data.results);
  }
});
```

## 📋 Code Quality

### Minimalist Principles Applied
- ✅ **Single Responsibility**: Each file has one clear purpose
- ✅ **No Redundancy**: Eliminated duplicate code and unused features
- ✅ **Clean Functions**: Pure functions with clear inputs/outputs
- ✅ **Error Handling**: Comprehensive but concise error management
- ✅ **Performance**: Direct OIDC access, no network interception
- ✅ **Maintainability**: Self-documenting code with clear structure

### Bug Prevention
- ✅ **Type Safety**: Proper data validation and parsing
- ✅ **Null Checks**: Safe property access with optional chaining
- ✅ **Async Handling**: Proper Promise management and error catching
- ✅ **Context Validation**: Extension context checks prevent crashes
- ✅ **Token Expiration**: Real-time OIDC token validation

## 🔒 Privacy & Security

- **🔒 Domain-Specific**: Only operates on `srem.moj.gov.sa`
- **🔒 No Data Collection**: Zero external data transmission
- **🔒 Local Processing**: All operations on user's device
- **🔒 OIDC Standard**: Industry-standard authentication
- **🔒 Minimal Permissions**: Only necessary Chrome permissions

## 📚 Documentation

- **[Installation Guide](docs/INSTALLATION_GUIDE.md)** - Detailed setup instructions
- **[Demo Files](demo/)** - Example implementations and tests
- **[Legacy Code](backup/)** - Previous implementation backup

## 🛠️ Development

### File Overview
```
extension/
├── manifest.json     # 40 lines - Extension config
├── background.js     # 150 lines - Core logic
├── popup.js          # 50 lines - Status interface
├── fullpage.js       # 200 lines - Search interface
├── content.js        # 10 lines - Domain check
└── bridge_content.js # 100 lines - External API
```

### Key Features
- **Zero Dependencies**: Pure JavaScript, no external libraries
- **CSP Compliant**: Strict Content Security Policy
- **RTL Support**: Full Arabic language support
- **Responsive Design**: Bootstrap-based responsive UI
- **Error Recovery**: Graceful degradation and error handling

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🏢 Support

For support, please visit [solutionsunity.com](https://solutionsunity.com) or create an issue in this repository.

---

**SREM.sa Real Estate Deeds Bridge** - Privacy-focused deed data extraction
© 2025 Solutions Unity Co. - [solutionsunity.com](https://solutionsunity.com)
