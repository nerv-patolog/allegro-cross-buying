// Background script for Allegro Seller Finder
// Minimal background script - most logic is now in popup and content scripts

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Allegro Seller Finder extension installed');
});

// Can be extended later for additional background tasks
// such as:
// - Badge updates
// - Notifications
// - Background sync
