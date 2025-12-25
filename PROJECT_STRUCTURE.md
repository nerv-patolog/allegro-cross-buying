# Project Structure

```
allegro-seller-finder/
│
├── src/                           # Source code
│   ├── popup/                     # Extension popup UI
│   │   ├── Popup.svelte          # Main popup component (Svelte 4)
│   │   ├── popup.html            # Popup HTML entry
│   │   └── popup.js              # Popup JS entry
│   │
│   ├── background/                # Background service worker
│   │   └── background.js         # Minimal background script
│   │
│   ├── content/                   # Content script
│   │   └── content.js            # Scrapes data from Allegro pages
│   │
│   ├── manifest.chrome.json      # Chrome/Chromium manifest (MV3)
│   └── manifest.firefox.json     # Firefox manifest (MV2)
│
├── public/                        # Static assets
│   └── icons/                     # Extension icons
│       ├── icon.svg              # Vector source
│       ├── icon16.png            # 16x16 icon
│       ├── icon48.png            # 48x48 icon
│       └── icon128.png           # 128x128 icon
│
├── scripts/                       # Build scripts
│   └── generate-icons.js         # Icon generator
│
├── dist-chrome/                   # Chrome build output (generated)
├── dist-firefox/                  # Firefox build output (generated)
│
├── docker-compose.yml            # Utility container for npm commands
├── vite.config.js                # Vite build configuration
├── svelte.config.js              # Svelte compiler config
├── package.json                  # Dependencies & scripts
│
├── README.md                     # Full documentation
├── QUICKSTART.md                 # Quick start guide
└── .gitignore                    # Git ignore rules
```

## Key Files

### Popup ([src/popup/Popup.svelte](src/popup/Popup.svelte))
- Product rows showing name, seller count, and remove button
- "Add to comparison" button - scrapes current page data
- "Calculate" button - finds common sellers (enabled with 2+ products)
- Material Design UI (orange/white/dark grey)
- Storage integration for persistence

### Content Script ([src/content/content.js](src/content/content.js))
- Scrapes product name from page
- Extracts seller names using DOM selectors
- Responds to messages from popup

### Background ([src/background/background.js](src/background/background.js))
- Minimal background script
- Installation listener
- Can be extended for notifications, badges, etc.

### Manifests
- Chrome MV3: [src/manifest.chrome.json](src/manifest.chrome.json)
- Firefox MV2: [src/manifest.firefox.json](src/manifest.firefox.json)

## Build Process

1. **Vite** bundles Svelte components
2. **vite-plugin-web-extension** handles manifest processing
3. Outputs to `dist-chrome/` or `dist-firefox/`
4. Ready to load as unpacked extension

## Technologies

- **Svelte 4** (UI framework)
- **Vite 5** (build tool)
- **Docker** (utility container for npm commands)
- **Material Design Icons** (SVG paths)
- **Chrome Extension API** / **WebExtensions API**

## Building the Extension

Using Docker utility container (no Node.js installation required):

```bash
# Install dependencies
docker compose run --rm npm install

# Build for Chrome
docker compose run --rm npm run build

# Build for Firefox
docker compose run --rm npm run build:firefox
```
