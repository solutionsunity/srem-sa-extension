// approval.js - Minimalist domain approval handler
const urlParams = new URLSearchParams(window.location.search);
const origin = urlParams.get('origin');
const appName = urlParams.get('appName');

// Display the request information
document.getElementById('domain').textContent = origin || 'Unknown domain';
document.getElementById('appName').textContent = appName || 'Unknown App';

function approve() {
  chrome.runtime.sendMessage({
    type: 'DOMAIN_APPROVAL',
    origin: origin,
    approved: true,
    days: 60  // Fixed 60 days
  }, (response) => {
    // Response is now properly handled by background.js
    if (chrome.runtime.lastError) {
      console.error('Error sending approval message:', chrome.runtime.lastError);
    }
    // Close window after message is sent
    window.close();
  });
}

function deny() {
  chrome.runtime.sendMessage({
    type: 'DOMAIN_APPROVAL',
    origin: origin,
    approved: false
  }, (response) => {
    // Response is now properly handled by background.js
    if (chrome.runtime.lastError) {
      console.error('Error sending denial message:', chrome.runtime.lastError);
    }
    // Close window after message is sent
    window.close();
  });
}

// Setup event listeners when DOM is loaded
window.addEventListener('load', () => {
  // Add click event listeners (no inline onclick)
  document.getElementById('approveBtn').addEventListener('click', approve);
  document.getElementById('denyBtn').addEventListener('click', deny);

  // Auto-focus on approve button
  document.getElementById('approveBtn').focus();

  // Handle keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      approve();
    } else if (event.key === 'Escape') {
      deny();
    }
  });
});
