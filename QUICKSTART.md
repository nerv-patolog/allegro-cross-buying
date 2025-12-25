# Quick Start Guide

Get up and running with Allegro Seller Finder in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Allegro account

## Step 1: Get Allegro API Credentials (2 minutes)

1. Visit [Allegro Developer Portal](https://apps.developer.allegro.pl/)
2. Sign in with your Allegro account
3. Click "Create new app"
4. Choose **"Client Credentials"** flow
5. Fill in app name (e.g., "Seller Finder")
6. Copy your **Client ID** and **Client Secret** (you'll need these in Step 3)

## Step 2: Install Dependencies (1 minute)

```bash
# Clone the repository
git clone <your-repo-url>
cd allegro-seller-finder

# Install extension dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

## Step 3: Configure (1 minute)

### Server Configuration

```bash
# Copy environment templates
cp .env.example .env
cd server
cp .env.example .env
```

Edit `server/.env` and paste your credentials:

```env
ALLEGRO_CLIENT_ID=your_client_id_from_step_1
ALLEGRO_CLIENT_SECRET=your_client_secret_from_step_1
PORT=3000
```

The root `.env` file should work as-is:

```env
VITE_PROXY_URL=http://localhost:3000
```

## Step 4: Build Extension (1 minute)

```bash
# Make sure you're in the project root
cd /path/to/allegro-seller-finder

# Generate icons
node scripts/generate-icons.js

# Build for Chrome (or use build:firefox for Firefox)
npm run build
```

## Step 5: Load Extension & Start Server (1 minute)

### Start the Proxy Server

**Keep this terminal open while using the extension!**

```bash
cd server
npm start
```

You should see:
```
✓ Allegro Proxy Server running on http://localhost:3000
✓ Allegro credentials configured
```

### Load in Browser

**Chrome/Edge:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist-chrome` folder

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `dist-firefox/manifest.json`

## You're Done! 🎉

### Test It Out

1. Go to any Allegro product page (e.g., https://allegro.pl/oferta/...)
2. Click the extension icon
3. Add some product URLs
4. Click "Find Common Sellers"

## Common Issues

### "Cannot connect to proxy server"
→ Make sure the server is running: `cd server && npm start`

### Server shows warnings about credentials
→ Check that you copied the Client ID and Secret correctly in `server/.env`

### Extension not appearing
→ Make sure you built it first: `npm run build`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [server/README.md](server/README.md) for proxy server details
- Configure optional API key for extra security in `server/.env`

## Development Mode

For active development:

**Terminal 1 - Server with auto-reload:**
```bash
cd server
npm run dev
```

**Terminal 2 - Extension with auto-rebuild:**
```bash
npm run dev
```

Then reload the extension in your browser after each rebuild.
