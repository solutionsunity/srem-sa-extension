# SREM Bridge API Reference

Complete API documentation for external application integration with the SREM Bridge Extension.

## 🔐 Security Model

The extension uses a **domain approval system** with two API tiers:

### Public API (No Approval Required)
- `SREM_EXTENSION_DISCOVERY` - Check if extension exists
- `SREM_REQUEST_APPROVAL` - Request domain approval

### Protected API (Requires Approval)
- `SREM_EXTENSION_PING` - Test extension availability
- `SREM_AUTH_STATUS_REQUEST` - Check SREM authentication
- `SREM_BRIDGE_REQUEST` - Search deed data

## 📡 Public API

### Extension Discovery

**Request:**
```javascript
window.postMessage({
  type: "SREM_EXTENSION_DISCOVERY",
  timestamp: Date.now()
}, "*");
```

**Response:**
```javascript
{
  type: "SREM_EXTENSION_EXISTS",
  extensionId: "abc123...",
  version: "1.1.0",
  name: "SREM.sa Real Estate Deeds Bridge",
  timestamp: 1757416000000
}
```

### Request Domain Approval

**Request:**
```javascript
window.postMessage({
  type: "SREM_REQUEST_APPROVAL",
  appName: "My CRM System",           // Optional: App display name
  reason: "Access deed data for CRM", // Optional: Reason for access
  timestamp: Date.now()
}, "*");
```

**Response:**
```javascript
{
  type: "SREM_APPROVAL_RESPONSE",
  approved: true,                     // true/false
  expiresAt: "2025-11-08T11:06:49.048Z", // ISO date (if approved)
  reason: "user_approved",            // approval reason
  timestamp: 1757416000000
}
```

**Approval Reasons:**
- `user_approved` - User clicked approve
- `user_denied` - User clicked deny
- `already_approved` - Domain already approved
- `timeout` - User didn't respond (30 seconds)

## 🔒 Protected API

*Note: These APIs require domain approval first.*

### Extension Ping

**Request:**
```javascript
window.postMessage({
  type: "SREM_EXTENSION_PING",
  timestamp: Date.now()
}, "*");
```

**Response:**
```javascript
{
  type: "SREM_EXTENSION_PONG",
  extensionId: "abc123...",
  timestamp: 1757416000000
}
```

### Authentication Status

**Request:**
```javascript
window.postMessage({
  type: "SREM_AUTH_STATUS_REQUEST",
  requestId: "auth_" + Date.now(),
  timestamp: Date.now()
}, "*");
```

**Response:**
```javascript
{
  type: "SREM_AUTH_STATUS_RESPONSE",
  requestId: "auth_1757416000000",
  authenticated: true,                // true/false
  status: "valid",                   // valid/expired/missing
  message: "Token is valid",         // Human-readable message
  timestamp: 1757416000000
}
```

### Deed Search

**Request:**
```javascript
window.postMessage({
  type: "SREM_BRIDGE_REQUEST",
  requestId: "search_" + Date.now(),
  deedNumbers: "123456,789012",      // Comma-separated deed numbers
  searchMode: "owner",               // "owner" or "date"

  // For owner search:
  ownerIdType: 1,                    // 1=National ID, 2=Iqama, 5=Commercial
  ownerId: "1234567890",             // Owner ID number

  // For date search:
  deedDateYear: 2024,                // Year
  deedDateMonth: 1,                  // Month (1-12)
  deedDateDay: 15,                   // Day (1-31)
  isHijriDate: false,                // true for Hijri, false for Gregorian

  timestamp: Date.now()
}, "*");
```

**Response:**
```javascript
{
  type: "SREM_BRIDGE_RESPONSE",
  requestId: "search_1757416000000",
  success: true,                     // Overall success
  result: [                          // Array of deed results (same as downloads)
    {
      deedNumber: "123456",
      success: true,
      data: {
        // Deed data object
        deedNumber: "123456",
        ownerName: "أحمد محمد",
        propertyType: "سكني",
        // ... other deed fields
      },
      error: null
    },
    {
      deedNumber: "789012",
      success: false,
      data: null,
      error: "Deed not found"
    }
  ],
  authStatus: "valid",               // Authentication status
  error: null,                       // Overall error (if any)
  timestamp: 1757416000000
}
```

## 📊 Data Format Consistency

Both extension downloads and Bridge API use consistent deed data formatting:

### Extension Downloads
**Single deed download:**
```json
{
  "result": [
    {
      "IsSuccess": true,
      "Data": {
        "DeedNo": 123456,
        "DeedDate": "26/8/1443",
        // ... other deed fields
      }
    }
  ]
}
```

**Multiple deed download:**
```json
{
  "result": [
    {
      "IsSuccess": true,
      "Data": { "DeedNo": 123456, /* ... */ }
    },
    {
      "IsSuccess": true,
      "Data": { "DeedNo": 789012, /* ... */ }
    }
  ]
}
```

### Bridge API Response
The Bridge API wraps deed data in response metadata but uses the same `result` field:
```json
{
  "type": "SREM_BRIDGE_RESPONSE",
  "success": true,
  "result": [
    {
      "deedNumber": "123456",
      "success": true,
      "data": {
        "IsSuccess": true,
        "Data": { "DeedNo": 123456, /* ... */ }
      },
      "error": null
    }
  ]
}
```

## 📚 JavaScript Library

For easier integration, use the provided `SremBridge` library:

```javascript
// Include the library
<script src="srem-bridge.js"></script>

// Initialize
const srem = new SremBridge('My App Name');

// Complete workflow
async function initSrem() {
  // Check if extension exists
  if (await srem.isAvailable()) {
    // Request approval
    const approval = await srem.requestApproval('Need deed data');

    if (approval.approved) {
      // Check authentication
      const auth = await srem.getAuthStatus();

      if (auth.authenticated) {
        // Search deeds
        const results = await srem.searchDeeds('123456', 'owner', 1, '1234567890');
        console.log('Results:', results);
      }
    }
  }
}

// Or use the simplified initialization
const result = await srem.initialize('My app needs SREM access');
if (result.ready) {
  // Ready to use all SREM features
}
```

## 🔄 Error Handling

### Common Error Scenarios

**Extension Not Found:**
```javascript
// No response to SREM_EXTENSION_DISCOVERY after 3 seconds
// Extension not installed or not enabled
```

**Domain Not Approved:**
```javascript
// No response to protected APIs
// Extension appears "dead" to unapproved domains
```

**Authentication Failed:**
```javascript
{
  type: "SREM_AUTH_STATUS_RESPONSE",
  authenticated: false,
  status: "expired",
  message: "Please login to SREM"
}
```

**Search Errors:**
```javascript
{
  type: "SREM_BRIDGE_RESPONSE",
  success: false,
  error: "Authentication required",
  authStatus: "expired"
}
```

## 🎯 Best Practices

### 1. Always Check Extension Availability
```javascript
const available = await srem.isAvailable();
if (!available) {
  showInstallPrompt();
  return;
}
```

### 2. Handle Approval Gracefully
```javascript
const approval = await srem.requestApproval('Reason for access');
if (!approval.approved) {
  showApprovalDeniedMessage(approval.reason);
  return;
}
```

### 3. Verify Authentication
```javascript
const auth = await srem.getAuthStatus();
if (!auth.authenticated) {
  showLoginPrompt();
  return;
}
```

### 4. Handle Search Results
```javascript
const results = await srem.searchDeeds('123456');
if (results.success) {
  results.result.forEach(deed => {
    if (deed.success) {
      processDeedData(deed.data);
    } else {
      console.warn(`Deed ${deed.deedNumber}: ${deed.error}`);
    }
  });
} else {
  console.error('Search failed:', results.error);
}
```

## 📋 Rate Limits

- **Maximum 50 deeds** per search request
- **2-second interval** between requests (enforced by extension)
- **60-day approval expiry** (user must re-approve after 60 days)

## 🔒 Security Notes

- Extension only responds to approved domains
- All communication uses `postMessage` API
- No data is stored or transmitted outside user's browser
- OIDC tokens remain in SREM domain only
- Domain approval required for all protected operations
