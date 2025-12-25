# Allegro Proxy Server

This is a Node.js proxy server that handles Allegro API requests for the browser extension. It solves CORS issues and keeps your API credentials secure.

## Why Do We Need This?

Browsers prevent extensions from making direct API calls to Allegro due to CORS (Cross-Origin Resource Sharing) restrictions. The proxy server:

1. **Solves CORS issues** - The extension calls the local server, which then calls Allegro API
2. **Keeps credentials secure** - API credentials stay on your machine, not in the browser
3. **Caches tokens** - Reduces API calls by caching access tokens
4. **Better error handling** - Provides clear error messages

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Allegro API credentials:

```env
ALLEGRO_CLIENT_ID=your_client_id_here
ALLEGRO_CLIENT_SECRET=your_client_secret_here
PORT=3000
```

**Where to get credentials:**

1. Go to [Allegro Developer Portal](https://apps.developer.allegro.pl/)
2. Sign in with your Allegro account
3. Create a new app or select an existing one
4. Copy the "Client ID" and "Client Secret"

### 3. Optional: Enable API Key Protection

If you want to add an extra layer of security:

```env
API_KEY=your_random_api_key_here
```

Then enter this same key in the extension's Options page.

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start at `http://localhost:3000` (or the PORT you specified in .env)

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and configuration info.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T10:30:00.000Z",
  "hasCredentials": true
}
```

### Get Sellers for Single Offer

```http
POST /api/offer/sellers
Content-Type: application/json

{
  "url": "https://allegro.pl/oferta/product-name-12345678901"
}
```

**Response:**
```json
{
  "productId": "123456",
  "currentSeller": {
    "id": "789",
    "login": "seller1"
  },
  "sellers": [
    { "id": "789", "login": "seller1" },
    { "id": "790", "login": "seller2" }
  ],
  "totalCount": 2
}
```

### Find Common Sellers Across Products

```http
POST /api/sellers/find-common
Content-Type: application/json

{
  "urls": [
    "https://allegro.pl/oferta/product1-12345",
    "https://allegro.pl/oferta/product2-67890"
  ]
}
```

**Response:**
```json
{
  "commonSellers": [
    { "id": "789", "login": "seller1" }
  ],
  "totalCommon": 1,
  "products": [
    {
      "url": "https://allegro.pl/oferta/product1-12345",
      "productId": "123",
      "sellerCount": 3,
      "sellers": [...]
    }
  ],
  "processedCount": 2
}
```

## Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Find common sellers
curl -X POST http://localhost:3000/api/sellers/find-common \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://allegro.pl/oferta/product-12345"]}'
```

### Using the .http file

If you have the REST Client extension in VS Code:

1. Open `.api/allegro/auth.http`
2. Click "Send Request" above any request

## Troubleshooting

### Error: ALLEGRO_CLIENT_ID and ALLEGRO_CLIENT_SECRET not set

Make sure you:
1. Created the `.env` file in the `server/` directory
2. Added your credentials from the Allegro Developer Portal
3. Restarted the server

### Error: Token request failed

Your credentials might be incorrect. Double-check:
1. Client ID matches exactly from Allegro Developer Portal
2. Client Secret matches exactly
3. No extra spaces or quotes in the `.env` file

### Extension can't connect to proxy

Make sure:
1. The server is running (`npm start` in server/ folder)
2. The server is running on port 3000 (or check VITE_PROXY_URL in extension's .env)
3. No firewall is blocking localhost connections

## How It Works

1. Extension sends product URLs to `/api/sellers/find-common`
2. Server authenticates with Allegro using OAuth 2.0
3. Server caches the access token for efficiency
4. For each URL:
   - Extracts offer ID
   - Fetches offer details from Allegro API
   - Gets all sellers for that product
5. Server finds intersection of all seller sets
6. Returns common sellers to extension

## Security Notes

- Credentials are stored in `.env` file on your local machine
- Never commit the `.env` file to version control (it's in `.gitignore`)
- The server only accepts connections from the browser extension
- Optional API key can be added for additional security
