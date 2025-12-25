<script>
  import { onMount } from 'svelte';

  let products = []; // Array of {id, name, sellers: [...], sellersCount}
  let isLoading = false;
  let error = '';
  let isAdding = false;

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
    await chrome.storage.local.set({ products: products });
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
        error = 'No product data found on this page. Make sure you\'re on a seller listing page.';
        isAdding = false;
        return;
      }

      // Add the product to our list
      const newProduct = {
        id: crypto.randomUUID(),
        name: response.productName,
        sellers: response.sellers,
        sellersCount: response.sellersCount
      };

      products = [...products, newProduct];
      await saveProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      error = err.message || 'Failed to scrape product data. Make sure you\'re on an Allegro seller listing page.';
    } finally {
      isAdding = false;
    }
  }

  async function removeProduct(id) {
    products = products.filter(p => p.id !== id);
    await saveProducts();
  }

  function calculateCommonSellers() {
    if (products.length < 2) {
      error = 'At least 2 products are required';
      return;
    }

    error = '';

    console.log('=== Allegro Cross-Buying Analysis ===');
    console.log(`Analyzing ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name}`);
      console.log(`Sellers (${product.sellersCount}):`);
      product.sellers.forEach(seller => {
        console.log(`  - ${seller}`);
      });
      console.log('');
    });

    // Find common sellers
    const sellerFrequency = new Map();

    products.forEach(product => {
      product.sellers.forEach(seller => {
        sellerFrequency.set(seller, (sellerFrequency.get(seller) || 0) + 1);
      });
    });

    // Group by frequency
    const sellersByFrequency = new Map();
    sellerFrequency.forEach((count, seller) => {
      if (!sellersByFrequency.has(count)) {
        sellersByFrequency.set(count, []);
      }
      sellersByFrequency.get(count).push(seller);
    });

    // Display results
    console.log('=== Common Sellers Analysis ===\n');
    const sortedFrequencies = Array.from(sellersByFrequency.keys()).sort((a, b) => b - a);

    sortedFrequencies.forEach(frequency => {
      const sellers = sellersByFrequency.get(frequency);
      console.log(`Sellers offering ${frequency} of ${products.length} products:`);
      sellers.forEach(seller => {
        console.log(`  - ${seller}`);
      });
      console.log('');
    });

    console.log('=== End of Analysis ===');
  }

  $: canCalculate = products.length >= 2 && products.every(p => p.sellersCount > 0);
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
              <div class="seller-count">{product.sellersCount} seller{product.sellersCount !== 1 ? 's' : ''}</div>
            </div>
            <button
              class="icon-btn remove-btn"
              on:click={() => removeProduct(product.id)}
              title="Remove"
            >
              <svg viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
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
      <button
        class="action-btn add-btn"
        on:click={addToComparison}
        disabled={isAdding}
      >
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
          <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19M6.5,17.25H9.5V18.75H6.5V17.25M6.5,14.25H9.5V15.75H6.5V14.25M6.5,11.25H9.5V12.75H6.5V11.25M6.5,8.25H9.5V9.75H6.5V8.25M6.5,5.25H9.5V6.75H6.5V5.25M11,17.25H18V18.75H11V17.25M11,14.25H18V15.75H11V14.25M11,11.25H18V12.75H11V11.25M11,8.25H18V9.75H11V8.25M11,5.25H18V6.75H11V5.25Z" />
        </svg>
        Calculate
      </button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #fff;
  }

  .popup {
    width: 30vw;
    min-width: 400px;
    max-width: 600px;
    max-height: 40vh;
    min-height: 300px;
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
    to { transform: rotate(360deg); }
  }
</style>
