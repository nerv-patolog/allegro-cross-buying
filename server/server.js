const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
require('dotenv').config();

// Use stealth plugin to evade bot detection
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
    cors({
        origin: '*', // Allow extension to connect (extensions have unique origins)
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'X-API-Key']
    })
);
app.use(express.json());

// API Key validation middleware (optional)
const validateApiKey = (req, res, next) => {
    if (process.env.API_KEY) {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: 'Invalid or missing API key' });
        }
    }
    next();
};

// Path to downloaded Chrome
const CHROME_PATH = path.join(__dirname, '.chrome', 'chrome-linux64', 'chrome');

// Helper function to add random delay
function randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Parse seller listing page to extract seller names using Puppeteer
async function parseSellersPage(url) {
    console.log(`Fetching sellers from: ${url}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: CHROME_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080',
                '--start-maximized'
            ]
        });

        const page = await browser.newPage();

        // Override navigator properties to avoid detection
        await page.evaluateOnNewDocument(() => {
            // Override the navigator properties
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Mock plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Mock languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['pl-PL', 'pl', 'en-US', 'en']
            });

            // Chrome runtime
            window.chrome = {
                runtime: {}
            };

            // Permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });

        // Set realistic viewport and user agent
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: true,
            isMobile: false
        });

        // Use a realistic modern user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

        // Set additional headers to appear more like a real browser
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        });

        // Add random delay before navigation to appear more human-like
        await randomDelay(500, 1500);

        // Navigate to the page with extended timeout
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait a bit for dynamic content to load (random delay to appear human)
        await randomDelay(2000, 4000);

        // Get the HTML content
        const html = await page.content();

        // Close the browser
        await browser.close();

        // Check for CAPTCHA or bot detection
        if (html.includes('captcha-delivery.com') ||
            html.includes('DataDome') ||
            html.includes('cf-chl-bypass') ||
            html.includes('Just a moment') ||
            html.length < 5000) {
            console.error('CAPTCHA or bot detection detected');
            throw new Error('Access blocked by anti-bot protection. The page may require human verification or the IP may be rate-limited.');
        }

        // Parse the HTML with Cheerio
        const $ = cheerio.load(html);
        const sellers = new Set();

        // Find seller names using the verified selector pattern
        // Look for spans with class 'mgmw_wo' that are preceded by 'od' text or 'Super Sprzedawcy'
        $('span.mgmw_wo').each((_i, elem) => {
            const $elem = $(elem);
            const parentElem = $elem.parent();

            // Check previous sibling for 'od' text
            const prevSibling = parentElem.prev();
            const prevSiblingText = prevSibling.text().trim();

            // Check parent's previous sibling for 'Super Sprzedawcy'
            const parentPrevSibling = parentElem.parent().prev().prev();
            const parentPrevSiblingText = parentPrevSibling.text().trim();

            // Add seller if it matches the pattern
            if (prevSiblingText === 'od' || parentPrevSiblingText.endsWith('Super Sprzedawcy')) {
                const sellerName = $elem.text().trim();
                if (sellerName && sellerName.length > 0) {
                    sellers.add(sellerName);
                }
            }
        });

        console.log(`Found ${sellers.size} unique sellers`);
        return Array.from(sellers);
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw error;
    }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Find common sellers across multiple product seller listing pages
app.post('/api/sellers/find-common', validateApiKey, async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        if (urls.length < 2) {
            return res.status(400).json({ error: 'At least 2 URLs are required to find common sellers' });
        }

        const allSellerSets = [];
        const sellerFrequency = new Map(); // Track how many products each seller appears in
        const productDetails = [];

        // Fetch sellers for all URLs in parallel instead of sequentially
        const results = await Promise.allSettled(
            urls.map(url => parseSellersPage(url).then(sellers => ({ url, sellers })))
        );

        // Process results
        results.forEach((result, index) => {
            const url = urls[index];

            if (result.status === 'fulfilled') {
                const sellers = result.value.sellers;

                if (sellers.length === 0) {
                    console.warn(`No sellers found for URL: ${url}`);
                    productDetails.push({
                        url,
                        sellerCount: 0,
                        sellers: [],
                        warning: 'No sellers found on this page'
                    });
                    return;
                }

                const sellerSet = new Set(sellers);
                allSellerSets.push(sellerSet);

                // Track frequency of each seller
                sellers.forEach(seller => {
                    sellerFrequency.set(seller, (sellerFrequency.get(seller) || 0) + 1);
                });

                productDetails.push({
                    url,
                    sellerCount: sellers.length,
                    sellers: sellers
                });

                console.log(`Processed ${url}: found ${sellers.length} sellers`);
            } else {
                console.error(`Error processing URL ${url}:`, result.reason);
                productDetails.push({
                    url,
                    error: result.reason.message || 'Failed to process URL'
                });
            }
        });

        if (allSellerSets.length === 0) {
            return res.status(400).json({
                error: 'No valid seller pages found',
                products: productDetails
            });
        }

        if (allSellerSets.length < 2) {
            return res.status(400).json({
                error: 'At least 2 valid seller pages are required',
                products: productDetails
            });
        }

        // Find sellers appearing in ALL products (complete intersection)
        let commonSellerNames = allSellerSets[0];
        for (let i = 1; i < allSellerSets.length; i++) {
            commonSellerNames = new Set(
                [...commonSellerNames].filter((name) => allSellerSets[i].has(name))
            );
        }

        // Group sellers by frequency (how many products they appear in)
        const sellersByFrequency = new Map();
        sellerFrequency.forEach((count, seller) => {
            if (!sellersByFrequency.has(count)) {
                sellersByFrequency.set(count, []);
            }
            sellersByFrequency.get(count).push(seller);
        });

        // Sort by frequency (descending) and create result array
        const sortedFrequencies = Array.from(sellersByFrequency.keys()).sort((a, b) => b - a);
        const groupedSellers = sortedFrequencies.map(frequency => ({
            frequency,
            totalProducts: allSellerSets.length,
            sellers: sellersByFrequency.get(frequency).map(name => ({
                name,
                url: `https://allegro.pl/uzytkownik/${encodeURIComponent(name)}`
            }))
        }));

        res.json({
            commonSellers: Array.from(commonSellerNames).map(name => ({
                name,
                url: `https://allegro.pl/uzytkownik/${encodeURIComponent(name)}`
            })),
            totalCommon: commonSellerNames.size,
            groupedByFrequency: groupedSellers,
            products: productDetails,
            processedCount: allSellerSets.length
        });
    } catch (error) {
        console.error('Error in /api/sellers/find-common:', error);
        res.status(500).json({
            error: 'Failed to find common sellers',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Allegro Seller Finder Server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log(`  GET  /health - Health check`);
    console.log(`  POST /api/sellers/find-common - Find common sellers across product pages`);
    console.log('');

    if (process.env.API_KEY) {
        console.log('✓ API key protection enabled');
    } else {
        console.log('ℹ️  API key protection disabled (set API_KEY in .env to enable)');
    }
    console.log('');
    console.log('Ready to parse Allegro seller listing pages!');
});
