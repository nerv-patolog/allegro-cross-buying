# Project Structure

```
allegro-seller-finder/
│
├── src/                           # Source code
│   ├── popup/                     # Extension popup UI
│   │   ├── Popup.svelte          # Main popup component (Svelte 5)
│   │   ├── popup.html            # Popup HTML entry
│   │   └── popup.js              # Popup JS entry
│   │
│   ├── options/                   # Settings page
│   │   ├── Options.svelte        # Settings component (Svelte 5)
│   │   ├── options.html          # Settings HTML entry
│   │   └── options.js            # Settings JS entry
│   │
│   ├── background/                # Background service worker
│   │   └── background.js         # Allegro API integration & seller logic
│   │
│   ├── content/                   # Content script
│   │   └── content.js            # Runs on Allegro product pages
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
- Product URL input list with add/remove
- Material Design UI (orange/white/dark grey)
- Max size: 40vh × 30vw
- Storage integration for persistence
- Results display with seller links

### Background ([src/background/background.js](src/background/background.js))
- Allegro API authentication (Device ID flow)
- Fetch sellers for each product
- Calculate seller intersections
- Update extension icon based on page

### Options ([src/options/Options.svelte](src/options/Options.svelte))
- Device ID configuration
- Settings persistence
- Setup instructions

### Manifests
- Chrome MV3: [src/manifest.chrome.json](src/manifest.chrome.json)
- Firefox MV2: [src/manifest.firefox.json](src/manifest.firefox.json)

## Build Process

1. **Vite** bundles Svelte components
2. **vite-plugin-web-extension** handles manifest processing
3. Outputs to `dist-chrome/` or `dist-firefox/`
4. Ready to load as unpacked extension

## Technologies

- **Svelte 5** (with runes)
- **Vite 5** (build tool)
- **Allegro REST API**
- **Material Design Icons** (SVG paths)
- **Chrome Extension API** / **WebExtensions API**
