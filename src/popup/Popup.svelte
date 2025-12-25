<script>
    import { onMount } from 'svelte';

    let products = []; // Array of {id, name, sellers: [...], sellersCount}
    let error = '';
    let isAdding = false;
    let commonSellersData = []; // Array of {seller, products: [product names]}
    let showResults = false;

    onMount(async () => {
        // Load saved products from storage
        await loadProducts();
    });

    async function loadProducts() {
        const stored = await chrome.storage.local.get(['products']);
        if (stored.products && stored.products.length > 0) {
            products = stored.products;
        }
    }

    async function saveProducts() {
        await chrome.storage.local.set({ products });
    }

    async function addToComparison() {
        error = '';
        isAdding = true;

        try {
            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Check if we're on an Allegro page
            if (!tab.url || !tab.url.includes('allegro.pl')) {
                error = 'Please navigate to an Allegro product page';
                isAdding = false;
                return;
            }

            // Send message to content script to scrape data
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeProductData' });

            if (!response.productName || !response.sellers || response.sellers.length === 0) {
                error =
                    "No product data found on this page. Make sure you're on a seller listing page.";
                isAdding = false;
                return;
            }

            // Add the product to our list
            const newProduct = {
                id: crypto.randomUUID(),
                name: response.productName,
                sellers: response.sellers,
            };

            products = [...products, newProduct];
            await saveProducts();
        } catch (err) {
            console.error('Error adding product:', err);
            error =
                err.message ||
                "Failed to scrape product data. Make sure you're on an Allegro seller listing page.";
        } finally {
            isAdding = false;
        }
    }

    async function removeProduct(id) {
        products = products.filter((p) => p.id !== id);
        await saveProducts();
    }

    function calculateCommonSellers() {
        if (products.length < 2) {
            error = 'At least 2 products are required';
            return;
        }

        error = '';

        // Create an object to track which products each seller appears in
        const sellerToProducts = {};

        // Loop through all products
        products.forEach((product) => {
            product.sellers.forEach((seller) => {
                if (!sellerToProducts[seller]) {
                    sellerToProducts[seller] = [];
                }
                sellerToProducts[seller].push(product.name);
            });
        });

        // Filter sellers that appear in at least 2 products
        const result = [];
        Object.keys(sellerToProducts).forEach((seller) => {
            if (sellerToProducts[seller].length > 1) {
                result.push({
                    seller: seller,
                    products: sellerToProducts[seller]
                });
            }
        });

        // Sort by number of products (descending), then by seller name
        result.sort((a, b) => {
            if (b.products.length !== a.products.length) {
                return b.products.length - a.products.length;
            }
            return a.seller.localeCompare(b.seller);
        });

        commonSellersData = result;
        showResults = true;
    }

    $: canCalculate = products.length >= 2 && products.every((p) => p.sellers.length > 0);
</script>

<div class="popup">
    <div class="header">
        <h1>Allegro Seller Finder</h1>
    </div>

    <div class="content">
        {#if products.length > 0}
            <div class="product-list">
                {#each products as product (product.id)}
                    <div class="product-row">
                        <div class="product-info">
                            <div class="product-name">{product.name}</div>
                            <div class="seller-count">
                                {product.sellers.length} seller{product.sellers.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <button
                            class="icon-btn remove-btn"
                            on:click={() => removeProduct(product.id)}
                            title="Remove"
                        >
                            <svg viewBox="0 0 24 24">
                                <path
                                    d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                                />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        {#if error}
            <div class="error">{error}</div>
        {/if}

        <div class="actions">
            <button class="action-btn add-btn" on:click={addToComparison} disabled={isAdding}>
                {#if isAdding}
                    <span class="spinner"></span>
                    Adding...
                {:else}
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    Add to comparison
                {/if}
            </button>

            <button
                class="action-btn calculate-btn"
                on:click={calculateCommonSellers}
                disabled={!canCalculate}
            >
                <svg class="icon" viewBox="0 0 24 24">
                    <path
                        d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19M6.5,17.25H9.5V18.75H6.5V17.25M6.5,14.25H9.5V15.75H6.5V14.25M6.5,11.25H9.5V12.75H6.5V11.25M6.5,8.25H9.5V9.75H6.5V8.25M6.5,5.25H9.5V6.75H6.5V5.25M11,17.25H18V18.75H11V17.25M11,14.25H18V15.75H11V14.25M11,11.25H18V12.75H11V11.25M11,8.25H18V9.75H11V8.25M11,5.25H18V6.75H11V5.25Z"
                    />
                </svg>
                Calculate
            </button>
        </div>

        {#if showResults}
            <div class="results">
                <h2>Common Sellers</h2>
                {#if commonSellersData.length === 0}
                    <div class="no-results">
                        No common sellers found. Each seller only appears in one product.
                    </div>
                {:else}
                    <div class="results-list">
                        {#each commonSellersData as item}
                            <div class="seller-item">
                                <div class="seller-header">
                                    <svg class="check-icon" viewBox="0 0 24 24">
                                        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                                    </svg>
                                    <span class="seller-name">{item.seller}</span>
                                    <span class="product-count">{item.products.length} products</span>
                                </div>
                                <div class="product-tags">
                                    {#each item.products as productName}
                                        <span class="product-tag">{productName}</span>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="results-summary">
                        Found {commonSellersData.length} seller{commonSellersData.length !== 1 ? 's' : ''} appearing in multiple products
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family:
            'Roboto',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
        background: #fff;
    }

    .popup {
        width: 30vw;
        min-width: 400px;
        max-width: 600px;
        max-height: 70vh;
        min-height: 500px;
        display: flex;
        flex-direction: column;
        background: #ffffff;
    }

    .header {
        background: #ff6d00;
        color: white;
        padding: 16px 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
    }

    .content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
    }

    .product-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
        max-height: 250px;
        overflow-y: auto;
    }

    .product-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f5f5f5;
        border-radius: 4px;
        border-left: 3px solid #ff6d00;
    }

    .product-info {
        flex: 1;
        min-width: 0;
    }

    .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #212121;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
    }

    .seller-count {
        font-size: 12px;
        color: #757575;
    }

    .icon-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .icon-btn svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
    }

    .remove-btn {
        background: #424242;
        color: white;
    }

    .remove-btn:hover {
        background: #616161;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .icon-btn:active {
        transform: scale(0.95);
    }

    .error {
        background: #ffebee;
        color: #c62828;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 13px;
        margin-bottom: 16px;
        border-left: 4px solid #c62828;
    }

    .actions {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 12px;
    }

    .action-btn {
        flex: 1;
        padding: 14px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: inherit;
    }

    .add-btn {
        background: #ff6d00;
        color: white;
    }

    .add-btn:hover:not(:disabled) {
        background: #f57c00;
        box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3);
    }

    .add-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .calculate-btn {
        background: #424242;
        color: white;
    }

    .calculate-btn:hover:not(:disabled) {
        background: #616161;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .calculate-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .icon {
        width: 18px;
        height: 18px;
        fill: currentColor;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .results {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
    }

    .results h2 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
        color: #212121;
    }

    .no-results {
        padding: 16px;
        text-align: center;
        color: #757575;
        font-size: 14px;
        background: #f5f5f5;
        border-radius: 4px;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
    }

    .seller-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
        background: #e8f5e9;
        border-radius: 4px;
        border-left: 3px solid #4caf50;
    }

    .seller-header {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .seller-name {
        font-size: 14px;
        font-weight: 500;
        color: #212121;
        flex: 1;
    }

    .product-count {
        font-size: 12px;
        color: #4caf50;
        font-weight: 500;
    }

    .check-icon {
        width: 20px;
        height: 20px;
        fill: #4caf50;
        flex-shrink: 0;
    }

    .product-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-left: 32px;
    }

    .product-tag {
        display: inline-block;
        padding: 4px 8px;
        background: #ffffff;
        border-radius: 12px;
        font-size: 11px;
        color: #616161;
        border: 1px solid #c8e6c9;
    }

    .results-summary {
        padding: 12px 16px;
        background: #fff3e0;
        border-radius: 4px;
        border-left: 3px solid #ff6d00;
        font-size: 13px;
        color: #e65100;
        font-weight: 500;
    }
</style>
