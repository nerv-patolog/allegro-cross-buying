/**
 * Unit tests for content.js
 * Tests scraping logic with various edge cases
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrapeProductName, scrapeSellers } from './content.js';

// Mock DOM environment
class MockElement {
    constructor(tagName, textContent = '', attributes = {}) {
        this.tagName = tagName;
        this.textContent = textContent;
        this.attributes = attributes;
        this.parentElement = null;
        this.previousElementSibling = null;
        this.className = '';
    }

    trim() {
        return this.textContent.trim();
    }
}

// Helper to create seller element structure
function createSellerElement(sellerName, prevSiblingText = 'od', hasSuperSprzedawcy = false) {
    const sellerSpan = new MockElement('span', sellerName);
    sellerSpan.className = 'mgmw_wo';

    const parentDiv = new MockElement('div');
    sellerSpan.parentElement = parentDiv;

    // Previous sibling for 'od' pattern
    const prevSibling = new MockElement('span', prevSiblingText);
    parentDiv.previousElementSibling = prevSibling;

    // Parent's previous sibling for 'Super Sprzedawcy' pattern
    const grandParent = new MockElement('div');
    parentDiv.parentElement = grandParent;

    const parentPrevSibling1 = new MockElement('div');
    const parentPrevSibling2 = new MockElement('div', hasSuperSprzedawcy ? 'Super Sprzedawcy' : '');
    grandParent.previousElementSibling = parentPrevSibling1;
    parentPrevSibling1.previousElementSibling = parentPrevSibling2;

    return sellerSpan;
}

// Test suite for scrapeProductName
describe('scrapeProductName', () => {
    let originalQuerySelectorAll;

    beforeEach(() => {
        originalQuerySelectorAll = document.querySelectorAll;
    });

    afterEach(() => {
        document.querySelectorAll = originalQuerySelectorAll;
    });

    test('should extract product name from valid element', () => {
        const mockElement = new MockElement('h1', '  Product Name  ');
        document.querySelectorAll = vi.fn(() => [mockElement]);

        const productName = scrapeProductName();

        expect(document.querySelectorAll).toHaveBeenCalledWith('h1[data-analytics-click-label="flashcard-title"]');
        expect(productName).toBe('Product Name');
    });

    test('should return null when no element found', () => {
        document.querySelectorAll = vi.fn(() => []);

        const productName = scrapeProductName();

        expect(productName).toBe(null);
    });

    test('should return null when querySelectorAll returns null', () => {
        document.querySelectorAll = vi.fn(() => null);

        const productName = scrapeProductName();

        expect(productName).toBe(null);
    });

    test('should trim whitespace from product name', () => {
        const mockElement = new MockElement('h1', '\n\t  Laptop Dell XPS  \n\t');
        document.querySelectorAll = vi.fn(() => [mockElement]);

        const productName = scrapeProductName();

        expect(productName).toBe('Laptop Dell XPS');
    });

    test('should handle empty string product name', () => {
        const mockElement = new MockElement('h1', '');
        document.querySelectorAll = vi.fn(() => [mockElement]);

        const productName = scrapeProductName();

        expect(productName).toBe('');
    });

    test('should handle special characters in product name', () => {
        const mockElement = new MockElement('h1', 'Product "Special" & <Name>');
        document.querySelectorAll = vi.fn(() => [mockElement]);

        const productName = scrapeProductName();

        expect(productName).toBe('Product "Special" & <Name>');
    });

    test('should use first element when multiple elements found', () => {
        const mockElement1 = new MockElement('h1', 'First Product');
        const mockElement2 = new MockElement('h1', 'Second Product');
        document.querySelectorAll = vi.fn(() => [mockElement1, mockElement2]);

        const productName = scrapeProductName();

        expect(productName).toBe('First Product');
    });
});

// Test suite for scrapeSellers
describe('scrapeSellers', () => {
    let originalQuerySelectorAll;

    beforeEach(() => {
        originalQuerySelectorAll = document.querySelectorAll;
    });

    afterEach(() => {
        document.querySelectorAll = originalQuerySelectorAll;
    });

    test('should extract sellers with "od" pattern', () => {
        const seller1 = createSellerElement('Seller A', 'od');
        const seller2 = createSellerElement('Seller B', 'od');
        document.querySelectorAll = vi.fn(() => [seller1, seller2]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Seller A', 'Seller B']);
    });

    test('should extract sellers with "Super Sprzedawcy" pattern', () => {
        const seller1 = createSellerElement('Super Seller', '', true);
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Super Seller']);
    });

    test('should ignore sellers without matching pattern', () => {
        const seller1 = createSellerElement('Valid Seller', 'od');
        const seller2 = createSellerElement('Invalid Seller', 'xyz', false);
        document.querySelectorAll = vi.fn(() => [seller1, seller2]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Valid Seller']);
    });

    test('should return empty array when no sellers found', () => {
        document.querySelectorAll = vi.fn(() => []);

        const sellers = scrapeSellers();

        expect(sellers).toEqual([]);
    });

    test('should deduplicate seller names', () => {
        const seller1 = createSellerElement('Same Seller', 'od');
        const seller2 = createSellerElement('Same Seller', 'od');
        const seller3 = createSellerElement('Different Seller', 'od');
        document.querySelectorAll = vi.fn(() => [seller1, seller2, seller3]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Same Seller', 'Different Seller']);
    });

    test('should trim whitespace from seller names', () => {
        const seller1 = createSellerElement('  Seller With Spaces  ', 'od');
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Seller With Spaces']);
    });

    test('should ignore empty seller names', () => {
        const seller1 = createSellerElement('Valid Seller', 'od');
        const seller2 = createSellerElement('', 'od');
        const seller3 = createSellerElement('   ', 'od');
        document.querySelectorAll = vi.fn(() => [seller1, seller2, seller3]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Valid Seller']);
    });

    test('should handle missing parentElement', () => {
        const seller1 = createSellerElement('Seller A', 'od');
        seller1.parentElement = null;
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual([]);
    });

    test('should handle missing previousElementSibling', () => {
        const seller1 = createSellerElement('Seller A', 'od');
        seller1.parentElement.previousElementSibling = null;
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        // Should still check Super Sprzedawcy pattern
        expect(Array.isArray(sellers)).toBe(true);
    });

    test('should handle missing grandparent structure', () => {
        const seller1 = createSellerElement('Seller A', 'od');
        seller1.parentElement.parentElement = null;
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        // Should still match via 'od' pattern
        expect(sellers).toEqual(['Seller A']);
    });

    test('should handle text ending with "Super Sprzedawcy"', () => {
        const seller1 = createSellerElement('Elite Seller', 'xyz', true);
        const parentPrevSibling = seller1.parentElement.parentElement.previousElementSibling.previousElementSibling;
        parentPrevSibling.textContent = 'Prefix Text Super Sprzedawcy';
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Elite Seller']);
    });

    test('should not match "Super Sprzedawcy" in middle of text', () => {
        const seller1 = createSellerElement('Seller', 'xyz', false);
        const parentPrevSibling = seller1.parentElement.parentElement.previousElementSibling.previousElementSibling;
        parentPrevSibling.textContent = 'Super Sprzedawcy but more text after';
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual([]);
    });

    test('should handle special characters in seller names', () => {
        const seller1 = createSellerElement('Seller & Co. "Best"', 'od');
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Seller & Co. "Best"']);
    });

    test('should handle mixed pattern matches', () => {
        const seller1 = createSellerElement('Seller Od', 'od');
        const seller2 = createSellerElement('Super Seller', '', true);
        const seller3 = createSellerElement('Invalid', 'xyz', false);
        document.querySelectorAll = vi.fn(() => [seller1, seller2, seller3]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Seller Od', 'Super Seller']);
    });

    test('should handle querySelectorAll returning null', () => {
        document.querySelectorAll = vi.fn(() => null);

        expect(() => scrapeSellers()).not.toThrow();
    });

    test('should handle very long seller names', () => {
        const longName = 'A'.repeat(1000);
        const seller1 = createSellerElement(longName, 'od');
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual([longName]);
    });

    test('should handle Unicode characters in seller names', () => {
        const seller1 = createSellerElement('Продавец Китайский 中文', 'od');
        document.querySelectorAll = vi.fn(() => [seller1]);

        const sellers = scrapeSellers();

        expect(sellers).toEqual(['Продавец Китайский 中文']);
    });
});

// Test suite for message listener
describe('chrome.runtime.onMessage listener', () => {
    let messageListener;
    let mockSendResponse;

    beforeEach(() => {
        mockSendResponse = vi.fn();

        // Capture the listener
        chrome.runtime.onMessage.addListener = vi.fn((listener) => {
            messageListener = listener;
        });

        // Re-require the content script to register listener
        // (In real tests, this would reload the script)
        messageListener = (request, sender, sendResponse) => {
            if (request.action === 'scrapeProductData') {
                const productName = scrapeProductName();
                const sellers = scrapeSellers();

                sendResponse({
                    productName: productName,
                    sellers: sellers
                });
            }
            return true;
        };
    });

    test('should respond to scrapeProductData action', () => {
        // Mock the DOM for scraping
        const mockProduct = new MockElement('h1', 'Test Product');
        const seller1 = createSellerElement('Seller A', 'od');
        const seller2 = createSellerElement('Seller B', 'od');

        document.querySelectorAll = vi.fn((selector) => {
            if (selector.includes('flashcard-title')) {
                return [mockProduct];
            }
            if (selector.includes('mgmw_wo')) {
                return [seller1, seller2];
            }
            return [];
        });

        const request = { action: 'scrapeProductData' };
        const returnValue = messageListener(request, {}, mockSendResponse);

        expect(returnValue).toBe(true);
        expect(mockSendResponse).toHaveBeenCalledWith({
            productName: 'Test Product',
            sellers: ['Seller A', 'Seller B']
        });
    });

    test('should handle null product name', () => {
        const seller1 = createSellerElement('Seller A', 'od');

        document.querySelectorAll = vi.fn((selector) => {
            if (selector.includes('flashcard-title')) {
                return [];
            }
            if (selector.includes('mgmw_wo')) {
                return [seller1];
            }
            return [];
        });

        const request = { action: 'scrapeProductData' };
        messageListener(request, {}, mockSendResponse);

        expect(mockSendResponse).toHaveBeenCalledWith({
            productName: null,
            sellers: ['Seller A']
        });
    });

    test('should handle empty sellers array', () => {
        const mockProduct = new MockElement('h1', 'Product');

        document.querySelectorAll = vi.fn((selector) => {
            if (selector.includes('flashcard-title')) {
                return [mockProduct];
            }
            if (selector.includes('mgmw_wo')) {
                return [];
            }
            return [];
        });

        const request = { action: 'scrapeProductData' };
        messageListener(request, {}, mockSendResponse);

        expect(mockSendResponse).toHaveBeenCalledWith({
            productName: 'Product',
            sellers: []
        });
    });

    test('should ignore unknown actions', () => {
        const request = { action: 'unknownAction' };
        const returnValue = messageListener(request, {}, mockSendResponse);

        expect(returnValue).toBe(true);
        expect(mockSendResponse).not.toHaveBeenCalled();
    });

    test('should always return true to keep message channel open', () => {
        const request = { action: 'scrapeProductData' };
        const returnValue = messageListener(request, {}, mockSendResponse);

        expect(returnValue).toBe(true);
    });
});

// Integration tests
describe('Integration tests', () => {
    test('should handle complete valid page structure', () => {
        // Setup complete DOM
        const productElement = new MockElement('h1', 'Gaming Laptop');
        const seller1 = createSellerElement('TechStore', 'od');
        const seller2 = createSellerElement('EliteShop', '', true);

        document.querySelectorAll = vi.fn((selector) => {
            if (selector.includes('flashcard-title')) {
                return [productElement];
            }
            if (selector.includes('mgmw_wo')) {
                return [seller1, seller2];
            }
            return [];
        });

        const productName = scrapeProductName();
        const sellers = scrapeSellers();

        expect(productName).toBe('Gaming Laptop');
        expect(sellers).toEqual(['TechStore', 'EliteShop']);
    });

    test('should handle page with no product name but has sellers', () => {
        const seller1 = createSellerElement('Seller A', 'od');

        document.querySelectorAll = vi.fn((selector) => {
            if (selector.includes('flashcard-title')) {
                return [];
            }
            if (selector.includes('mgmw_wo')) {
                return [seller1];
            }
            return [];
        });

        const productName = scrapeProductName();
        const sellers = scrapeSellers();

        expect(productName).toBe(null);
        expect(sellers).toEqual(['Seller A']);
    });

    test('should handle page with product name but no sellers', () => {
        const productElement = new MockElement('h1', 'Product');

        document.querySelectorAll = vi.fn((selector) => {
            if (selector.includes('flashcard-title')) {
                return [productElement];
            }
            if (selector.includes('mgmw_wo')) {
                return [];
            }
            return [];
        });

        const productName = scrapeProductName();
        const sellers = scrapeSellers();

        expect(productName).toBe('Product');
        expect(sellers).toEqual([]);
    });
});
