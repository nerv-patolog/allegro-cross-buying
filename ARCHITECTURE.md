# Architecture Documentation

## Overview

Allegro Seller Finder uses a **client-server architecture** to parse Allegro seller listing pages and find common sellers across multiple products.

## Components

### 1. Browser Extension (Client)

**Location:** `src/`

**Technologies:**
- Svelte 4.2.20 for UI components
- Vite 5.4.11 for building
- Chrome Extension Manifest V3 / Firefox Manifest V2

**Key Files:**
- `src/background/background.js` - Handles communication with backend server
- `src/popup/Popup.svelte` - Main UI for adding seller listing URLs and viewing results
- `src/manifest.chrome.json` / `src/manifest.firefox.json` - Extension manifests

**Responsibilities:**
- Display UI to users
- Collect seller listing page URLs from user (minimum 2)
- Send requests to local backend server
- Display grouped results from server
- Handle user interactions
- Persist saved URLs to storage

### 2. Backend Server

**Location:** `server/`

**Technologies:**
- Node.js + Express.js
- node-fetch for HTTP requests
- Cheerio for HTML parsing
- CORS middleware
- dotenv for configuration

**Key Files:**
- `server/server.js` - Main server implementation (parsing logic)
- `server/.env` - Optional configuration (port, API key)
- `server/package.json` - Dependencies

**Responsibilities:**
- Fetch seller listing pages from Allegro
- Parse HTML to extract seller names
- Track seller frequency across products
- Find intersections between seller lists
- Group sellers by frequency
- Handle CORS properly
- Provide clear error messages

## Data Flow

```
┌─────────────────────────────────────┐
│  User finds seller listing pages    │
│  on Allegro (minimum 2)             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Browser Extension Popup            │
│  - User pastes seller listing URLs  │
│  - Clicks "Find Common Sellers"     │
└────────┬────────────────────────────┘
         │
         │ POST /api/sellers/find-common
         │ { urls: [url1, url2, ...] }
         ▼
┌─────────────────────────────────────┐
│  Backend Server (localhost:3000)    │
│  1. For each URL:                   │
│     - Fetch page HTML               │
│     - Parse with Cheerio            │
│     - Extract seller names          │
│  2. Track seller frequency          │
│  3. Find intersections              │
│  4. Group by frequency              │
└────────┬────────────────────────────┘
         │
         │ HTTP GET (for each URL)
         ▼
┌─────────────────────────────────────┐
│  Allegro.pl Website                 │
│  - Returns HTML pages               │
└────────┬────────────────────────────┘
         │
         │ HTML content
         ▼
┌─────────────────────────────────────┐
│  Backend Server                     │
│  - Parses seller names from HTML    │
│  - Groups sellers by frequency      │
│  - Returns formatted response       │
└────────┬────────────────────────────┘
         │
         │ {
         │   groupedByFrequency: [...],
         │   commonSellers: [...]
         │ }
         ▼
┌─────────────────────────────────────┐
│  Extension Popup                    │
│  - Displays sellers grouped by      │
│    frequency (most common first)    │
│  - Shows clickable links            │
└─────────────────────────────────────┘
```

## Why This Architecture?

### Problem 1: No Public API for Seller Listings

Allegro doesn't provide a public API endpoint to retrieve all sellers for a given product without authentication complexities.

### Problem 2: CORS Restrictions

Browsers prevent extensions from directly fetching and parsing external website content due to CORS (Cross-Origin Resource Sharing) security policies.

### Solution: Local Backend Server

By running a local Node.js server:
1. **Bypasses CORS** - The extension calls `localhost:3000` (same origin is allowed)
2. **Server-to-Server** - The backend makes standard HTTPS calls to Allegro (no CORS restrictions)
3. **HTML Parsing** - Server can parse HTML content using Cheerio
4. **No Authentication Needed** - No Allegro API credentials required
5. **Better Error Handling** - Server can provide detailed error messages
6. **Flexible Parsing** - Can adjust selectors as needed without rebuilding extension

## Security Considerations

### No Credentials Required

✅ **Advantages:**
- No Allegro API credentials needed
- No OAuth flow to manage
- Simple setup for users
- No risk of credential exposure

### API Key Protection (Optional)

The server supports an optional `API_KEY` in `server/.env`:

```env
API_KEY=your_random_key_here
```

When set:
- Extension must send `X-API-Key` header with every request
- Server validates the key before processing requests
- Prevents unauthorized access to your server

This is optional because:
- The server only runs locally (localhost)
- Useful if you want extra security or deploy the server remotely

### Web Scraping Considerations

- The server fetches public Allegro pages (no authentication required)
- Uses proper User-Agent headers
- Respects Allegro's publicly accessible content
- If Allegro changes their HTML structure, parsing may break

## Configuration Files

### Extension Environment (`.env`)

```env
VITE_PROXY_URL=http://localhost:3000
```

- Vite replaces `import.meta.env.VITE_PROXY_URL` during build
- Change this if your server runs on a different port
- Requires rebuild after changes

### Server Environment (`server/.env`)

```env
PORT=3000
API_KEY=optional_api_key
NODE_ENV=development
```

- Server reads these on startup (all optional)
- Restart server after changes
- Never commit this file to git if it contains sensitive data

## API Endpoints

### Extension → Backend Server

#### POST /api/sellers/find-common

**Request:**
```json
{
  "urls": [
    "https://allegro.pl/.../seller-listing-page-1",
    "https://allegro.pl/.../seller-listing-page-2"
  ]
}
```

**Response:**
```json
{
  "commonSellers": [
    {
      "name": "seller_name",
      "url": "https://allegro.pl/uzytkownik/seller_name"
    }
  ],
  "totalCommon": 1,
  "groupedByFrequency": [
    {
      "frequency": 2,
      "totalProducts": 2,
      "sellers": [
        {
          "name": "seller_appearing_in_both",
          "url": "https://allegro.pl/uzytkownik/seller_appearing_in_both"
        }
      ]
    },
    {
      "frequency": 1,
      "totalProducts": 2,
      "sellers": [...]
    }
  ],
  "products": [
    {
      "url": "https://allegro.pl/.../seller-listing-page-1",
      "sellerCount": 5,
      "sellers": ["seller1", "seller2", ...]
    }
  ],
  "processedCount": 2
}
```

#### GET /health

Check server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Error Handling

### Extension Level

- Check if backend server is reachable
- Display user-friendly error messages
- Log errors to browser console
- Validate minimum 2 URLs requirement

### Server Level

- Validate request parameters (minimum 2 URLs)
- Catch HTTP fetch errors
- Catch HTML parsing errors
- Return appropriate HTTP status codes
- Log errors to server console with details

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Cannot connect to server | Server not running | Start server: `cd server && npm start` |
| At least 2 URLs required | Less than 2 URLs provided | Add more seller listing URLs |
| No sellers found | Parsing failed | Check server logs, HTML structure may have changed |
| Failed to fetch page | Network error or invalid URL | Verify URLs are accessible |

## Performance Optimizations

### Parallel Page Fetching (Future)

Currently pages are fetched sequentially. Could be improved:

```javascript
const sellerLists = await Promise.all(
  urls.map(url => parseSellersPage(url))
);
```

- Fetches all pages simultaneously
- Significantly faster than sequential requests
- Takes advantage of Node.js async capabilities

### Set-based Intersection

```javascript
let commonSellerNames = allSellerSets[0];
for (let i = 1; i < allSellerSets.length; i++) {
  commonSellerNames = new Set(
    [...commonSellerNames].filter((name) => allSellerSets[i].has(name))
  );
}
```

- Uses JavaScript Set for efficient lookups
- O(n*m) complexity where n = sellers, m = products

### Future Optimizations

- [ ] Cache parsed results to avoid re-fetching same pages
- [ ] Parallel page fetching with Promise.all
- [ ] Request deduplication for duplicate URLs
- [ ] Add Redis for distributed caching
- [ ] Rate limiting to avoid overwhelming Allegro servers

## Development Workflow

### Building Extension

```bash
# Development (watch mode)
npm run dev

# Production
npm run build
npm run build:firefox
```

### Running Server

```bash
# Development (with auto-reload)
cd server && npm run dev

# Production
cd server && npm start
```

### Making Changes

1. **Extension code changes** (`src/`):
   - Edit files
   - Vite auto-rebuilds (in dev mode)
   - Reload extension in browser

2. **Server code changes** (`server/`):
   - Edit `server.js`
   - Nodemon auto-restarts (in dev mode)
   - No browser reload needed

3. **Environment changes** (`.env`):
   - Extension: Rebuild required
   - Server: Restart required

## Deployment Considerations

### Current Setup (Local Only)

- Server runs on `localhost:3000`
- Extension connects to `http://localhost:3000`
- Both must run on same machine

### Remote Deployment (Future)

To deploy the proxy server remotely:

1. **Host the server** (e.g., Heroku, DigitalOcean, AWS)
2. **Update `.env`**:
   ```env
   VITE_PROXY_URL=https://your-server.com
   ```
3. **Rebuild extension**
4. **Update CORS settings** in server to allow extension origin
5. **Add authentication** (API key becomes essential)
6. **Use HTTPS** (required for production)

Challenges:
- Browser extensions require HTTPS for remote connections
- Need to manage API rate limits across users
- Security becomes more critical

## Testing

### Manual Testing

1. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test seller lookup:**
   ```bash
   curl -X POST http://localhost:3000/api/sellers/find-common \
     -H "Content-Type: application/json" \
     -d '{"urls":["https://allegro.pl/oferta/product-12345"]}'
   ```

3. **Test extension:**
   - Go to Allegro product page
   - Open extension popup
   - Add products and search

### Unit Testing (Future)

- [ ] Jest for server logic
- [ ] Vitest for extension components
- [ ] Mock Allegro API responses
- [ ] Test error scenarios

## Monitoring

### Server Logs

The server logs:
- Token refresh events
- Incoming requests
- API errors
- Cache hits/misses

### Browser Console

The extension logs:
- Proxy connection status
- Request/response data
- User actions
- Errors

## Troubleshooting

See [README.md](README.md#troubleshooting) for common issues and solutions.
