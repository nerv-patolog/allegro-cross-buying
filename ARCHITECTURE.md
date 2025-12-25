# Architecture Documentation

## Overview

Allegro Seller Finder is a **client-side browser extension** that scrapes seller data directly from Allegro product pages and finds common sellers across multiple products. No backend server required.

## Components

### 1. Browser Extension Popup

**Location:** `src/popup/`

**Technologies:**
- Svelte 4.2.20 for UI components
- Chrome Extension Storage API for persistence

**Key Files:**
- `src/popup/Popup.svelte` - Main UI component
- `src/popup/popup.html` - HTML entry point
- `src/popup/popup.js` - JavaScript entry point

**Responsibilities:**
- Display product list with names and seller counts
- Provide "Add to comparison" button to trigger scraping
- Provide "Calculate" button to find common sellers
- Store and retrieve product data from chrome.storage
- Display seller analysis in browser console

### 2. Content Script

**Location:** `src/content/`

**Technologies:**
- Vanilla JavaScript
- DOM manipulation and querying

**Key Files:**
- `src/content/content.js` - Page scraping logic

**Responsibilities:**
- Scrape product name from current page
- Extract seller names using CSS selectors
- Respond to messages from popup
- Return scraped data to popup

### 3. Background Script

**Location:** `src/background/`

**Key Files:**
- `src/background/background.js` - Minimal background worker

**Responsibilities:**
- Listen for extension installation
- Can be extended for notifications, badges, etc.
- Currently minimal implementation

## Data Flow

```
┌─────────────────────────────────────┐
│  User navigates to Allegro product  │
│  page with seller listings          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  User clicks extension icon         │
│  Popup opens                        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  User clicks "Add to comparison"    │
└────────┬────────────────────────────┘
         │
         │ chrome.tabs.sendMessage()
         ▼
┌─────────────────────────────────────┐
│  Content Script (on page)           │
│  - Scrapes product name             │
│  - Scrapes seller names             │
│  - Returns data                     │
└────────┬────────────────────────────┘
         │
         │ { productName, sellers, sellersCount }
         ▼
┌─────────────────────────────────────┐
│  Popup                              │
│  - Stores product in                │
│    chrome.storage.local             │
│  - Displays product row             │
└────────┬────────────────────────────┘
         │
         │ User repeats for more products
         ▼
┌─────────────────────────────────────┐
│  User clicks "Calculate"            │
│  (when 2+ products added)           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Popup calculates common sellers    │
│  - Groups sellers by frequency      │
│  - Logs results to console          │
└─────────────────────────────────────┘
```

## Architecture Benefits

### No Backend Server
- **Simpler Setup**: No need to run and maintain a server
- **Faster**: Direct DOM scraping without network roundtrips
- **More Reliable**: No server downtime or connection issues
- **Privacy**: All data stays local in the browser

### Client-Side Scraping
- **Real-time**: Scrapes current page state
- **Accurate**: Gets data directly from DOM
- **No CORS Issues**: Content script runs in page context

### Storage Strategy
- **chrome.storage.local**: Persists product data across sessions
- **Data Structure**: `{ id, name, sellers: [], sellersCount }`
- **Simple**: No complex state management needed

## Key Selectors

### Product Name
```javascript
document.querySelectorAll('h1[data-analytics-click-label="flashcard-title"]')
```

### Seller Names
```javascript
document.querySelectorAll('span.mgmw_wo')
```

With validation logic:
- Check previous sibling for "od" text
- Or check parent's previous sibling for "Super Sprzedawcy"

## Security Considerations

### Content Script Permissions
- Runs only on `https://allegro.pl/*` domains
- Minimal permissions required
- No external network requests

### Data Storage
- All data stored locally in browser
- No transmission to external servers
- User can clear data by removing extension

### XSS Protection
- Content script doesn't inject HTML
- Only reads DOM, doesn't modify it
- Popup sanitizes displayed data

## Performance Optimizations

### Efficient Selectors
- Uses specific CSS selectors for fast queries
- Minimal DOM traversal
- Set-based deduplication

### Storage
- Stores only essential data (names, seller lists)
- No redundant information
- Efficient JSON serialization

### Memory
- Products stored in storage, not in memory
- Loaded on-demand when popup opens
- Minimal background script footprint

## Error Handling

### Content Script
- Checks if elements exist before accessing
- Returns null for missing data
- Handles edge cases (no sellers, no name)

### Popup
- Validates page URL before scraping
- Displays error messages to user
- Handles empty/invalid data gracefully

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| No product data found | Not on seller listing page | Navigate to correct page type |
| Cannot read properties | Page structure changed | Update selectors in content script |
| At least 2 products required | Only 1 product added | Add more products |

## Future Enhancements

- [ ] Display results in popup UI instead of console
- [ ] Export results to clipboard
- [ ] Price comparison feature
- [ ] Product thumbnails
- [ ] Seller profile links
- [ ] Dark mode
- [ ] Import/export product lists

## Build Process

### Using Docker Utility Container
```bash
# Install dependencies
docker compose run --rm npm install

# Build for Chrome
docker compose run --rm npm run build

# Build for Firefox
docker compose run --rm npm run build:firefox
```

### Build Output
- **Chrome**: `dist-chrome/` directory
- **Firefox**: `dist-firefox/` directory
- Contains bundled JS, HTML, icons, and manifest

### Technologies
- **Vite**: Bundler and dev server
- **Svelte**: UI framework
- **vite-plugin-web-extension**: Manifest processing
- **Docker**: Utility container for npm commands
