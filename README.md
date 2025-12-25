# Allegro Seller Finder

A browser extension for finding common sellers across multiple Allegro.pl products to help optimize your shopping cart and avoid delivery fees.

## Features

- 🔍 Find sellers that offer multiple products you're interested in
- 📊 Track products and sellers directly from Allegro pages
- 💰 Optimize your cart to reach the 45 PLN minimum per seller for free delivery
- 🎨 Clean Material Design UI with Svelte
- 🦊 Cross-browser support (Chrome/Chromium and Firefox)
- 💾 Persistent product list storage
- ⚡ No server needed - works entirely client-side by scraping page data

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd allegro-seller-finder
```

2. Install extension dependencies:
```bash
npm install
```

3. Generate icon placeholders:
```bash
node scripts/generate-icons.js
```

4. Build the extension:

For Chrome/Chromium:
```bash
npm run build
```

For Firefox:
```bash
npm run build:firefox
```

### Load the Extension

#### Chrome/Chromium

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist-chrome` folder

#### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to `dist-firefox` folder
4. Select the `manifest.json` file

## Usage

1. **Go to an Allegro product page** with multiple sellers:
   - Find a product you want to buy
   - Look for the "Inne oferty" (Other offers) section showing all sellers
   - Make sure you're on the page that lists all sellers for that product

2. **Click the extension icon** - the popup will open

3. **Add the current product to comparison**:
   - If no products are saved yet, you'll see an "Add to comparison" button
   - Click it to scrape the product name and sellers from the current page
   - The product will be added as a row showing [Product Name] [Number of Sellers] [Remove button]

4. **Repeat for more products**:
   - Navigate to another Allegro product's seller listing page
   - Open the extension popup
   - Click "Add to comparison" again
   - Add at least 2 products total to enable the Calculate button

5. **Remove products**:
   - Click the remove (×) button next to any product row to delete it

6. **Calculate common sellers**:
   - Once you have 2 or more products added, the "Calculate" button becomes enabled
   - Click "Calculate" to find sellers that appear across multiple products
   - Results will be logged to the browser console (F12)

## Development

### Project Structure

```
allegro-seller-finder/
├── src/
│   ├── popup/              # Popup UI (Svelte)
│   │   ├── Popup.svelte   # Main UI component
│   │   ├── popup.html
│   │   └── popup.js
│   ├── content/            # Content script
│   │   └── content.js     # Scrapes data from Allegro pages
│   ├── background/         # Background service worker (optional)
│   │   └── background.js
│   ├── manifest.chrome.json
│   └── manifest.firefox.json
├── public/
│   └── icons/              # Extension icons
├── scripts/
│   └── generate-icons.js
├── vite.config.js
└── package.json
```

### Available Scripts

- `npm run dev` - Build and watch for changes (Chrome)
- `npm run build` - Production build for Chrome
- `npm run build:firefox` - Production build for Firefox

### Tech Stack

- **Frontend**: Svelte 4.2.20
- **Build Tool**: Vite 5.4.11
- **Content Script**: Vanilla JavaScript (DOM scraping)
- **Icons**: Material Design Icons (SVG paths)

## How It Works

### Architecture

1. **User navigates** to an Allegro product seller listing page
2. **Content script** scrapes the product name and seller names from the page DOM
3. **Extension popup** stores and displays the collected data
4. **Calculate function** finds common sellers across saved products

### Flow

1. **User Navigation**: Navigate to an Allegro product page showing all sellers
2. **Data Collection**: Click "Add to comparison" to scrape product name and seller names
3. **Storage**: Product data is saved to chrome.storage.local
4. **Display**: Product appears as a row with [Name] [Seller Count] [Remove]
5. **Comparison**: Click "Calculate" (enabled when 2+ products) to find common sellers
6. **Results**: Seller names are logged to console

## Limitations

- Requires seller listing page (not individual product pages)
- Parsing depends on Allegro's HTML structure (may break if they change their layout)
- Minimum 2 products required for comparison
- Currently outputs results to console only (future: display in UI)

## Future Enhancements

- [ ] Better icon design
- [ ] Display results in UI instead of console
- [ ] Price comparison for sellers
- [ ] Total savings calculator
- [ ] Export results to clipboard
- [ ] Dark mode support
- [ ] Improve HTML parsing robustness (handle multiple page layouts)
- [ ] Show product thumbnails

## Troubleshooting

### "No product data found" error
- Make sure you're on an Allegro product page with multiple sellers listed
- Look for the "Inne oferty" (Other offers) section
- The page must show seller names (not just a single product page)

### "At least 2 products are required" error
- You need to add at least 2 products to enable the Calculate button
- Navigate to different Allegro product pages and click "Add to comparison" for each

### No sellers found
- Verify you're on the correct seller listing page
- Check the browser console (F12) for error messages
- The HTML structure may have changed - check the content script selectors

### Parsing errors
- The HTML structure of Allegro pages may have changed
- You may need to update the CSS selectors in content script
- Open an issue on GitHub if parsing consistently fails

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
