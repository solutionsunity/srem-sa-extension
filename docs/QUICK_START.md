# SREM Extension - Quick Start Guide

## 🚀 Installation (2 minutes)

### Step 1: Download Extension
- Download the `extension/` folder from this repository
- Or clone: `git clone [repository-url]`

### Step 2: Load in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Extension icon appears in toolbar ✅

### Step 3: Login to SREM
1. Visit [srem.moj.gov.sa](https://srem.moj.gov.sa)
2. Complete Nafath authentication
3. Verify you're logged in ✅

### Step 4: Use Extension
1. Click extension icon in Chrome toolbar
2. Status should show "متصل" (Connected)
3. Click "فتح الصفحة الكاملة" (Open Full Page)
4. Start searching for deeds! 🎉

## 🔍 Quick Search Example

### Owner Search
1. Enter deed numbers: `123456, 789012`
2. Select owner ID type: `National ID`
3. Enter owner ID: `1234567890`
4. Click "استعلام عن الصكوك" (Search Deeds)

### Date Search
1. Enter deed numbers: `123456, 789012`
2. Switch to "Date" tab
3. Select date and calendar type
4. Click "استعلام عن الصكوك" (Search Deeds)

## 🌐 External App Integration

### Step 1: Check Extension Availability
```javascript
// Public API - always works
window.postMessage({ type: "SREM_EXTENSION_DISCOVERY" }, "*");

window.addEventListener("message", (event) => {
  if (event.data.type === "SREM_EXTENSION_EXISTS") {
    console.log("Extension found:", event.data.name, event.data.version);
  }
});
```

### Step 2: Request Domain Approval
```javascript
// Public API - triggers approval popup
window.postMessage({
  type: "SREM_REQUEST_APPROVAL",
  appName: "My CRM System",
  reason: "Need access to deed data"
}, "*");

window.addEventListener("message", (event) => {
  if (event.data.type === "SREM_APPROVAL_RESPONSE") {
    if (event.data.approved) {
      console.log("Approved! Access granted for 60 days");
    } else {
      console.log("Approval denied:", event.data.reason);
    }
  }
});
```

### Step 3: Search Deeds (After Approval)
```javascript
// Protected API - requires approval
window.postMessage({
  type: "SREM_BRIDGE_REQUEST",
  requestId: "search_" + Date.now(),
  deedNumbers: "123456,789012",
  searchMode: "owner",
  ownerIdType: 1,
  ownerId: "1234567890"
}, "*");
```

### Using the Bridge Library (Recommended)
```javascript
// Include srem-bridge.js in your page
const srem = new SremBridge('My App Name');

// Complete workflow
async function searchDeeds() {
  if (await srem.isAvailable()) {
    const approval = await srem.requestApproval('Need deed data');
    if (approval.approved) {
      const deeds = await srem.searchDeeds('123456', 'owner', 1, '1234567890');
      console.log('Found deeds:', deeds);
    }
  }
}
```

## 🔐 Security Notes

- **Domain approval required** for protected APIs
- **60-day approval expiry** - users must re-approve
- First visit → approval popup, subsequent visits → seamless access

## 🔧 Troubleshooting

### Extension shows "غير متصل" (Disconnected)
- ✅ Ensure you're logged into SREM.sa
- ✅ Refresh the SREM page
- ✅ Check if session expired

### No search results
- ✅ Verify deed numbers are correct
- ✅ Check owner ID format
- ✅ Try different search mode

### Bridge API not working
- ✅ Check extension is installed and enabled
- ✅ Open browser console for error messages
- ✅ Verify PostMessage format

## 📞 Support

- **Website**: [solutionsunity.com](https://solutionsunity.com)
- **Issues**: Create an issue in this repository
- **Documentation**: See main [README.md](../README.md)

---

© 2025 Solutions Unity Co.
