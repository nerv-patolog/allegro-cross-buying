# Allegro Seller Finder

A browser extension for finding common sellers across multiple Allegro.pl products to help optimize your shopping cart and avoid delivery fees.

## Features

- 🔍 Find sellers that offer multiple products you're interested in
- 📊 Sellers grouped by frequency (see which sellers offer most of your products)
- 💰 Optimize your cart to reach the 45 PLN minimum per seller for free delivery
- 🎨 Clean Material Design UI with Svelte
- 🦊 Cross-browser support (Chrome/Chromium and Firefox)
- 💾 Persistent product list storage
- ⚡ No API credentials needed - works by parsing seller listing pages

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

3. **Set up the backend server** (required):

```bash
# Navigate to server directory
cd server

# Install server dependencies
npm install
```

4. **Optional: Configure API key** (for security):

```bash
# Copy environment template
cp .env.example .env

# Edit .env and optionally set an API key
nano .env  # or use your preferred editor
```

Example `server/.env`:
```env
PORT=3000
API_KEY=your_optional_api_key_here
```

5. Generate icon placeholders:
```bash
# Back to project root
cd ..
node scripts/generate-icons.js
```

6. Build the extension:

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

### Start the Backend Server

**IMPORTANT**: The server must be running for the extension to work!

```bash
cd server
npm start
```

You should see:
```
Allegro Seller Finder Server running on http://localhost:3000
```

Keep this terminal window open while using the extension.

## Usage

1. **Make sure the backend server is running** (`npm start` in `server/` folder)

2. **Find the seller listing pages** for your products:
   - Go to any Allegro product page
   - Look for the "Inne oferty" (Other offers) section
   - Click to see all sellers for that product
   - Copy the URL of the seller listing page
   - Repeat for at least 2 products you want to buy

3. **Click the extension icon** - the popup will open

4. **Add product seller listing URLs** (minimum 2):
   - Paste the seller listing page URLs into the input fields
   - Click the **+** button to add each URL
   - A new empty input will appear below
   - Add at least 2 URLs to find common sellers

5. **Remove products**:
   - Click the **×** button next to any URL to remove it

6. **Find common sellers**:
   - Click the **"Find Common Sellers"** button at the bottom
   - The extension will parse each page and find sellers

7. **View results grouped by frequency**:
   - Sellers are grouped by how many products they offer
   - "All X products" sellers appear first (these sell everything you want!)
   - Then sellers offering X-1 products, etc.
   - Click on any seller name to visit their Allegro store
   - Click "Back to Search" to modify your search

## Development

### Project Structure

```
allegro-seller-finder/
├── server/                 # Backend server (Node.js + Express)
│   ├── server.js          # Main server file (parses Allegro pages)
│   ├── package.json       # Server dependencies
│   └── .env.example       # Environment template
├── src/
│   ├── popup/              # Popup UI (Svelte)
│   │   ├── Popup.svelte
│   │   ├── popup.html
│   │   └── popup.js
│   ├── background/         # Background service worker
│   │   └── background.js  # Communicates with server
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

**Extension:**
- `npm run dev` - Build and watch for changes (Chrome)
- `npm run build` - Production build for Chrome
- `npm run build:firefox` - Production build for Firefox

**Backend Server:**
- `cd server && npm start` - Start the server
- `cd server && npm run dev` - Start with auto-reload (development)

### Tech Stack

- **Frontend**: Svelte 4.2.20
- **Build Tool**: Vite 5.4.11
- **Server**: Node.js + Express.js
- **Parsing**: Cheerio (HTML parsing)
- **Icons**: Material Design Icons (SVG paths)

## How It Works

### Architecture

1. **Browser Extension** → Communicates with local backend server
2. **Backend Server** → Parses Allegro seller listing pages
3. **Seller Comparison** → Finds intersections between seller lists

### Flow

1. **User Input**: You provide URLs to seller listing pages (minimum 2)
2. **Request to Server**: Extension sends all URLs to the local backend server
3. **Page Parsing**: Server fetches each URL and parses the HTML to extract seller names
4. **Frequency Calculation**: Server tracks which sellers appear in which products
5. **Grouping**: Sellers are grouped by frequency (how many products they offer)
6. **Results**: Grouped sellers are returned to the extension and displayed

### API Endpoints

**Server Endpoints:**
- `GET /health` - Check server status
- `POST /api/sellers/find-common` - Find common sellers across multiple seller listing pages

## Limitations

- Requires local backend server to be running
- Requires seller listing page URLs (not direct product pages)
- Parsing depends on Allegro's HTML structure (may break if they change their layout)
- Server must run on localhost (browser extensions can't connect to remote servers without additional config)
- Minimum 2 seller listing URLs required

## Future Enhancements

- [ ] Better icon design
- [ ] Automatic seller page detection (detect and convert product URLs to seller listing URLs)
- [ ] Price comparison for sellers
- [ ] Total savings calculator
- [ ] Export results to clipboard
- [ ] Dark mode support
- [ ] Product name display instead of just URLs
- [ ] Deploy server option (for remote access)
- [ ] Support for saved searches
- [ ] Improve HTML parsing robustness (handle multiple page layouts)
- [ ] Cache parsed results to avoid re-fetching

## Troubleshooting

### "Cannot connect to server" error
**Most common issue!**
- Make sure the backend server is running: `cd server && npm start`
- Verify the server is running on http://localhost:3000
- Check the terminal for any error messages from the server
- If you changed the port, update `VITE_PROXY_URL` in `.env` and rebuild the extension

### "At least 2 URLs are required" error
- You need to add at least 2 seller listing page URLs
- Make sure you're using seller listing pages, not individual product pages
- Each URL should show multiple sellers for a single product

### No sellers found
- Verify you're using the correct seller listing page URLs
- Some products might not have overlapping sellers
- Try with more popular products or different combinations
- Check the browser console (F12) for error messages
- Check the server terminal for parsing errors

### Parsing errors
- The HTML structure of Allegro pages may have changed
- Check server logs for details
- You may need to update the CSS selectors in `server/server.js`
- Open an issue on GitHub if parsing consistently fails

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
