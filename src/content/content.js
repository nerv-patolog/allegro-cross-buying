// Content script for Allegro product pages
// This script runs on all Allegro product pages

// Notify background script that we're on a product page
chrome.runtime.sendMessage({ action: 'onProductPage' });

// Can be extended later for additional functionality like
// - Auto-extracting product details
// - Highlighting sellers
// - Injecting UI elements into the page
