# SREM Bridge Extension - Installation Guide

This guide will walk you through installing and setting up the SREM Bridge Extension for Chrome.

## 📋 Prerequisites

- **Google Chrome** (version 88 or later) or **Chromium-based browser**
- **Internet connection** for accessing SREM services
- **SREM account** with valid credentials for srem.moj.gov.sa

## 🚀 Installation Steps

### Step 1: Download the Extension

1. Download or clone the `srem-sa-extension` repository to your computer
2. Navigate to the `extension/` folder
3. Ensure all files are present in the extension directory:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html` and `popup.js`
   - `fullpage.html` and `fullpage.js`
   - `bridge_content.js`
   - `approval.html` and `approval.js`
   - `css/`, `fonts/`, `icons/` folders

### Step 2: Enable Developer Mode in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/` in the address bar
3. In the top-right corner, toggle **"Developer mode"** to ON
4. You should see additional buttons appear: "Load unpacked", "Pack extension", "Update"

### Step 3: Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to and select the `extension/` folder (inside srem-sa-extension)
3. Click **"Select Folder"** (or "Open" on some systems)
4. The extension should now appear in your extensions list

### Step 4: Verify Installation

1. Look for the SREM Bridge Extension in your extensions list
2. Ensure it shows as **"Enabled"**
3. You should see the extension icon in your Chrome toolbar
4. If the icon is not visible, click the puzzle piece icon (🧩) and pin the SREM Bridge Extension

## ⚙️ Initial Setup

### Step 1: Test Extension Popup

1. Click the SREM Bridge Extension icon in your toolbar
2. You should see a popup with:
   - Connection status (initially "غير متصل" - Not Connected)
   - "فتح الصفحة الكاملة" button (Open Full Page)
   - "تحديث الحالة" button (Refresh Status)

### Step 2: Login to SREM

1. Open a new tab and navigate to [https://srem.moj.gov.sa](https://srem.moj.gov.sa)
2. Complete the login process:
   - Click "تسجيل دخول" (Login)
   - Enter your National ID
   - Complete Nafath authentication on your mobile device
   - Select "اصالة" (Individual) when prompted
3. Navigate to the deed inquiry section or any SREM page that requires authentication

### Step 3: Verify Connection

1. Return to the extension popup
2. Click "تحديث الحالة" (Refresh Status)
3. The status should change to "متصل" (Connected) with a green indicator
4. If still not connected, try refreshing the SREM page and checking again

## 🔧 Testing the Extension

### Test 1: Basic Functionality

1. Click "فتح الصفحة الكاملة" (Open Full Page) from the popup
2. The full interface should open in a new tab
3. Verify that the connection status shows as connected

### Test 2: Deed Search

1. In the full page interface, enter test data:
   - **Deed Number**: Any valid deed number you have access to
   - **ID Type**: Select appropriate type (National ID, Iqama, or Commercial ID)
   - **ID Number**: Enter the corresponding ID number
2. Click "استعلام" (Search)
3. If successful, you should see deed information displayed
4. Try downloading the JSON data

### Test 3: Bridge Functionality

1. Open `bridge_demo.html` in a new browser tab
2. The page should detect the extension automatically
3. Check that the status shows "✅ SREM Bridge Extension is ready!"
4. Test the authentication status check
5. Try fetching deed data through the demo interface

## 🛠️ Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear after loading
**Solutions**:
- Ensure all files are in the correct directory structure
- Check that `manifest.json` is valid (no syntax errors)
- Try reloading the extension from `chrome://extensions/`
- Check Chrome console for error messages

### Connection Issues

**Problem**: Extension shows "Not Connected" even after SREM login
**Solutions**:
- Ensure you're logged into SREM in the same browser
- Try refreshing the SREM page after login
- Clear browser cache and cookies, then login again
- Check that you've completed the full authentication flow (including Nafath)

### Authentication Token Not Found

**Problem**: Extension can't find authentication token
**Solutions**:
- Make sure you've navigated to a SREM page that requires authentication
- Try accessing the deed inquiry section specifically
- Check browser console for token extraction messages
- Ensure cookies are enabled for srem.moj.gov.sa

### API Errors

**Problem**: Deed search returns errors
**Solutions**:
- Verify the deed number and owner information are correct
- Ensure you have permission to access the specific deed
- Check that the owner ID type matches the ID number format
- Try with a different deed number you know exists

### Bridge Demo Not Working

**Problem**: Bridge demo page doesn't detect extension
**Solutions**:
- Ensure the extension is loaded and enabled
- Refresh the demo page
- Check browser console for communication errors
- Verify the extension has permissions for localhost

## 📱 Mobile/Nafath Authentication

The extension requires Nafath authentication through the official mobile app:

1. **Install Nafath App**: Download from your device's app store
2. **Register**: Complete registration with your National ID
3. **Login Process**: When logging into SREM:
   - Enter your National ID on the website
   - A code will appear on screen
   - Open Nafath app and approve the login request
   - Select the matching code number

## 🔒 Security Notes

- **Never share your authentication tokens** with unauthorized parties
- **Log out of SREM** when finished to invalidate tokens
- **Keep the extension updated** for security patches
- **Only use on trusted networks** when accessing sensitive deed data

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. **Check Browser Console**: Press F12 and look for error messages
2. **Verify Permissions**: Ensure the extension has all required permissions
3. **Test with Different Data**: Try with various deed numbers and owner information
4. **Clear Extension Data**: Remove and reinstall the extension if needed

## 🔄 Updating the Extension

To update the extension with new features or fixes:

1. Download the updated extension files
2. Go to `chrome://extensions/`
3. Find the SREM Bridge Extension
4. Click the refresh/reload button (🔄)
5. Or remove the old version and load the new one

## ✅ Verification Checklist

Before using the extension in production:

- [ ] Extension loads without errors
- [ ] Popup interface displays correctly
- [ ] Full page interface opens and functions
- [ ] SREM login and authentication work
- [ ] Connection status updates correctly
- [ ] Deed search returns valid data
- [ ] JSON download functionality works
- [ ] Bridge demo page detects extension
- [ ] External app integration functions (if applicable)

## 📋 System Requirements

- **Browser**: Chrome 88+ or Chromium-based browser
- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **Memory**: Minimum 4GB RAM recommended
- **Network**: Stable internet connection
- **Permissions**: Admin rights may be required for installation

This completes the installation guide. The extension should now be ready for use with SREM deed inquiry services.
