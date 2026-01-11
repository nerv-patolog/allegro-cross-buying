# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Allegro Seller Finder** is a browser extension for finding common sellers across multiple Allegro.pl products. The extension scrapes product and seller data client-side (no backend) to help users optimize shopping carts and avoid delivery fees by finding sellers that carry multiple desired products.

**Key Goal**: Users can add multiple Allegro products, then calculate which sellers appear across multiple products to consolidate purchases and reach the 45 PLN free delivery threshold.

## Common Commands

### Development
- `npm run dev` - Build and watch for changes (Chrome)
- `npm run build` - Production build for Chrome (outputs to `dist-chrome/`)
- `npm run build:firefox` - Production build for Firefox (outputs to `dist-firefox/`)

### Testing
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- Run single test file: `npx vitest run src/content/content.test.js`
- Run tests matching pattern: `npx vitest run -t "pattern"`

### Code Quality
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting

## Architecture

### Browser Extension Components

**Content Script** (`src/content/content.js`)
- Runs on all `https://allegro.pl/*` pages
- Exports `scrapeProductName()` and `scrapeSellers()` functions for testing
- Listens for `scrapeProductData` messages from popup
- Returns `{ productName, sellers }` to popup
- Uses specific CSS selectors: `h1[data-analytics-click-label="flashcard-title"]` for product names, `span.mgmw_wo` for seller names
- Seller extraction requires validation: checks for "od" in previous sibling OR "Super Sprzedawcy" ending in parent's previous sibling

**Popup UI** (`src/popup/Popup.svelte`)
- Manages product list in `chrome.storage.local`
- Structure: `{ id, name, sellers: [] }`
- Implements `calculateCommonSellers()` to find sellers appearing in 2+ products
- Shows results inline (no longer console-only)
- Uses reactive statement: `$: canCalculate = products.length >= 2 && products.every((p) => p.sellers.length > 0)`

**Background Script** (`src/background/background.js`)
- Minimal implementation (listens to install event)
- Can be extended for notifications, badges, etc.

### Data Flow
1. User navigates to Allegro product page with seller listings ("Inne oferty" section)
2. User clicks extension icon → popup opens
3. User clicks "Add to comparison" → popup sends `scrapeProductData` message to content script
4. Content script scrapes product name and seller names from DOM → returns to popup
5. Popup stores product in `chrome.storage.local` and displays it
6. User repeats for multiple products
7. User clicks "Calculate" (enabled when 2+ products) → popup calculates common sellers
8. Results display in popup UI showing sellers appearing in multiple products, sorted by frequency

### Build System

**Vite Configuration** (`vite.config.js`)
- Uses `vite-plugin-web-extension` for manifest processing
- Mode-based builds: `--mode firefox` switches to Firefox manifest and output directory
- Builds separate manifests: `src/manifest.chrome.json` vs `src/manifest.firefox.json`
- Output directories: `dist-chrome/` or `dist-firefox/`
- Sourcemaps enabled, minification disabled

**Test Configuration** (`vitest.config.js`)
- Environment: jsdom (for DOM testing)
- Globals enabled
- Setup file: `vitest.setup.js` (mocks Chrome APIs)
- Coverage: V8 provider, excludes entry points like `popup.js` and `background.js`
- Test pattern: `**/*.test.js`

### Testing Setup

**Global Mocks** (`vitest.setup.js`)
- Mocks `chrome.runtime`, `chrome.storage`, `chrome.tabs` APIs
- Uses Vitest's `vi.fn()` for all Chrome API methods
- Cleans up DOM after each test

**Test Philosophy**
- Content script exports scraping functions for unit testing
- Tests include edge cases: missing DOM elements, null checks, whitespace handling, Unicode, deduplication
- Integration tests verify complete scraping workflows
- Message listener tests verify Chrome extension messaging protocol

## Important Implementation Details

### Scraping Logic Validation
When modifying seller scraping in `content.js`, remember:
- Sellers must match one of two patterns: previous sibling text === "od" OR parent's previous sibling ends with "Super Sprzedawcy"
- Empty seller names are filtered out after trimming
- Seller names are deduplicated using Set
- Handle missing DOM elements gracefully (null checks for parentElement, previousElementSibling)

### Storage Structure
Products stored in `chrome.storage.local` as:
```javascript
{
  products: [
    { id: "uuid", name: "Product Name", sellers: ["Seller A", "Seller B"] }
  ]
}
```

### Common Sellers Algorithm
The `calculateCommonSellers()` function:
1. Creates a map of `seller → [product names]`
2. Filters sellers appearing in 2+ products
3. Sorts by product count (descending), then seller name (alphabetically)
4. Returns `[{ seller: "name", products: ["Product 1", "Product 2"] }]`

### Cross-Browser Support
- Chrome uses Manifest V3 with service worker
- Firefox uses same manifest structure but built separately
- Both share identical codebase except manifest files

## Known Limitations

- Requires being on seller listing page (not individual product page)
- Scraping depends on Allegro's HTML structure (selectors may break if layout changes)
- Minimum 2 products required for common seller calculation
- Content script must be able to send messages (requires proper permissions)
