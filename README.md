# SREM.sa Real Estate Deeds Bridge

A privacy-focused Chrome extension for extracting real estate deed data from SREM.sa with secure domain approval system.

## 🚀 Quick Start

### Installation
1. Download the `extension/` folder
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `extension/` folder
5. Login to [srem.moj.gov.sa](https://srem.moj.gov.sa)

### Usage
1. Click extension icon → "فتح الصفحة الكاملة"
2. Enter deed numbers and search criteria
3. Download results as JSON

## 🌐 External App Integration

### Public API (No Approval Required)
```javascript
// Check if extension exists
window.postMessage({ type: "SREM_EXTENSION_DISCOVERY" }, "*");

// Request domain approval
window.postMessage({
  type: "SREM_REQUEST_APPROVAL",
  appName: "My App",
  reason: "Need deed data access"
}, "*");
```

### Protected API (Requires Approval)
```javascript
// Search deeds (after approval)
window.postMessage({
  type: "SREM_BRIDGE_REQUEST",
  requestId: Date.now().toString(),
  deedNumbers: "123456,789012",
  searchMode: "owner",
  ownerIdType: 1,
  ownerId: "1234567890"
}, "*");

// Response uses same schema as downloads
// { type: "SREM_BRIDGE_RESPONSE", result: [...] }
```

## 🎯 Features

- **🔒 Privacy-First**: Domain approval system with 60-day expiry
- **🔐 Secure Authentication**: Uses SREM's native OIDC tokens
- **📊 Dual Search Modes**: Search by owner ID or deed date
- **💾 JSON Export**: Download individual or bulk deed data
- **🌐 Public API**: External application integration with approval

## 📚 Documentation

- **[Installation Guide](docs/INSTALLATION_GUIDE.md)** - Detailed setup instructions
- **[Quick Start Guide](docs/QUICK_START.md)** - Fast setup and usage
- **[Demo Files](demo/)** - Example implementations and tests

## ⚠️ Disclaimer

This application has no official relation to the Ministry of Justice of Saudi Arabia or the SREM service.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

© 2025 Solutions Unity Co. - [solutionsunity.com](https://solutionsunity.com)
