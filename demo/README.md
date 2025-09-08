# SREM Extension Demo Files

This directory contains demo and test files for the SREM Bridge Extension.

## 📁 Files

### 🌉 **bridge_demo.html**
**Complete API testing interface**
- Full-featured demo with all extension capabilities
- Owner and date search modes
- Real-time response logging
- Export functionality
- Professional UI for comprehensive testing

### 🔧 **simple_test.html**
**Quick functionality test**
- Minimal interface for basic testing
- Extension availability check
- Authentication status verification
- Perfect for quick validation

### 🛠️ **developer_example.html**
**Code examples and integration guide**
- Live code examples with syntax highlighting
- API reference documentation
- Interactive testing environment
- Dark theme for developers

## 🚀 Usage Instructions

### Prerequisites
1. Install the SREM extension in Chrome
2. Login to [srem.moj.gov.sa](https://srem.moj.gov.sa)
3. Open any demo file in your browser

### Testing Flow
1. **Start with simple_test.html** - Verify basic functionality
2. **Use bridge_demo.html** - Test full API capabilities
3. **Check developer_example.html** - See integration examples

## 🔌 API Overview

### Message Types

#### Send to Extension:
- `SREM_EXTENSION_PING` - Test availability
- `SREM_AUTH_STATUS_REQUEST` - Check authentication
- `SREM_BRIDGE_REQUEST` - Search deeds

#### Receive from Extension:
- `SREM_EXTENSION_PONG` - Extension available
- `SREM_AUTH_STATUS_RESPONSE` - Authentication status
- `SREM_BRIDGE_RESPONSE` - Search results

### Search Modes

#### Owner Search:
```javascript
{
  type: "SREM_BRIDGE_REQUEST",
  searchMode: "owner",
  deedNumbers: "123456, 789012",
  ownerIdType: 1, // 1=National, 2=Iqama, 5=Commercial
  ownerId: "1234567890"
}
```

#### Date Search:
```javascript
{
  type: "SREM_BRIDGE_REQUEST",
  searchMode: "date",
  deedNumbers: "123456, 789012",
  deedDateYear: 2024,
  deedDateMonth: 1,
  deedDateDay: 15,
  isHijriDate: false // true for Hijri calendar
}
```

## ⚠️ Important Notes

- **Authentication Required**: Must be logged into SREM before testing
- **Domain Specific**: Extension only works on authorized domains
- **Privacy Focused**: No data is stored or transmitted outside SREM
- **Real-time**: All communication is live with SREM servers

## 🐛 Troubleshooting

### Extension Not Responding
- Check if extension is installed and enabled
- Verify you're logged into SREM
- Refresh the page and try again

### Authentication Failures
- Login to SREM in another tab
- Check if session has expired
- Verify OIDC token is valid

### Search Errors
- Ensure deed numbers are valid
- Check date format for date searches
- Verify owner ID format and type

## 📞 Support

For issues or questions:
- Check the main README.md
- Review the extension documentation
- Contact: Solutions Unity Co.

---

**Disclaimer:** This application has no official relation to Ministry of Justice or SREM service.

© 2025 Solutions Unity Co.
