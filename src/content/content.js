// Content script for Allegro product pages
// This script runs on all Allegro product pages

// Function to scrape product name from the page
function scrapeProductName() {
    const productNameElements = document.querySelectorAll(
        'h1[data-analytics-click-label="flashcard-title"]'
    );
    if (productNameElements.length > 0) {
        return productNameElements[0].textContent.trim();
    }
    return null;
}

// Function to scrape seller names from the page
function scrapeSellers() {
    const sellers = new Set();

    // Find seller names using the verified selector pattern
    // Look for spans with class 'mgmw_wo' that are preceded by 'od' text or 'Super Sprzedawcy'
    const sellerElements = document.querySelectorAll('span.mgmw_wo');

    sellerElements.forEach((elem) => {
        const parentElem = elem.parentElement;

        // Check previous sibling for 'od' text
        const prevSibling = parentElem.previousElementSibling;
        const prevSiblingText = prevSibling ? prevSibling.textContent.trim() : '';

        // Check parent's previous sibling for 'Super Sprzedawcy'
        const parentPrevSibling =
            parentElem.parentElement?.previousElementSibling?.previousElementSibling;
        const parentPrevSiblingText = parentPrevSibling ? parentPrevSibling.textContent.trim() : '';

        // Add seller if it matches the pattern
        if (prevSiblingText === 'od' || parentPrevSiblingText.endsWith('Super Sprzedawcy')) {
            const sellerName = elem.textContent.trim();
            if (sellerName && sellerName.length > 0) {
                sellers.add(sellerName);
            }
        }
    });

    return Array.from(sellers);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeProductData') {
        const productName = scrapeProductName();
        const sellers = scrapeSellers();

        sendResponse({
            productName: productName,
            sellers: sellers
        });
    }
    return true; // Keep the message channel open for async response
});
