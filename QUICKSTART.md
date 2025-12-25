# Quick Start Guide

Get up and running with Allegro Seller Finder in 5 minutes!

## Prerequisites

- Docker installed (for building without Node.js)
- Or Node.js 18+ if you prefer local setup

## Step 1: Install Dependencies (1 minute)

Using Docker (recommended - no Node.js installation needed):
```bash
docker compose run --rm npm install
```

Or with local Node.js:
```bash
npm install
```

## Step 2: Generate Icons (1 minute)

Using Docker:
```bash
docker compose run --rm npm run node scripts/generate-icons.js
```

Or with local Node.js:
```bash
node scripts/generate-icons.js
```

## Step 3: Build Extension (1 minute)

Using Docker:
```bash
# Build for Chrome
docker compose run --rm npm run build

# Or build for Firefox
docker compose run --rm npm run build:firefox
```

Or with local Node.js:
```bash
npm run build
# or
npm run build:firefox
```

## Step 4: Load Extension in Browser

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

### How to Use

1. Navigate to an Allegro product page with seller listings
2. Click the extension icon
3. Click "Add to comparison" to scrape the current page
4. Navigate to another product page and add it too
5. Once you have 2+ products, click "Calculate"
6. Open browser console (F12) to see the seller analysis

## Common Issues

### "No product data found"
→ Make sure you're on an Allegro product page with multiple sellers listed

### Extension not appearing
→ Make sure you built it first

### Docker permission denied
→ Add your user to the docker group: `sudo usermod -aG docker $USER` (then log out/in)

## Development Mode

For active development with auto-rebuild:

Using Docker:
```bash
docker compose run --rm npm run dev
```

Or with local Node.js:
```bash
npm run dev
```

Then reload the extension in your browser after each rebuild.
