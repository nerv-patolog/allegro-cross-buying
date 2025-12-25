<script>
  import { onMount } from 'svelte';

  let products = [{ url: '', id: crypto.randomUUID(), saved: false }];
  let isLoading = false;
  let results = null;
  let error = '';
  let loadingMessage = 'Searching...';

  onMount(async () => {
    // Load saved products from storage
    const stored = await chrome.storage.local.get(['products']);
    if (stored.products && stored.products.length > 0) {
      products = [
        ...stored.products.map(url => ({ url, id: crypto.randomUUID(), saved: true })),
        { url: '', id: crypto.randomUUID(), saved: false }
      ];
    }
  });

  async function saveProducts() {
    const urls = products.filter(p => p.saved).map(p => p.url);
    await chrome.storage.local.set({ products: urls });
  }

  function addProduct(index) {
    if (!products[index].url.trim()) {
      error = 'Please enter a product URL';
      return;
    }

    if (!isValidAllegroUrl(products[index].url)) {
      error = 'Please enter a valid Allegro URL';
      return;
    }

    error = '';
    products[index].saved = true;
    products = [...products, { url: '', id: crypto.randomUUID(), saved: false }];
    saveProducts();
  }

  function removeProduct(index) {
    products = products.filter((_, i) => i !== index);
    if (products.filter(p => p.saved).length === 0) {
      products = [{ url: '', id: crypto.randomUUID(), saved: false }];
    }
    saveProducts();
  }

  function updateProduct(index, value) {
    products[index].url = value;
    error = '';
  }

  function handleKeyPress(event, index) {
    if (event.key === 'Enter' && !products[index].saved) {
      addProduct(index);
    }
  }

  function isValidAllegroUrl(url) {
    try {
      const urlObj = new URL(url);
      // Accept seller listing pages (where all sellers for a product are shown)
      return urlObj.hostname.includes('allegro.pl');
    } catch {
      return false;
    }
  }

  async function findCommonSellers() {
    error = '';
    results = null;

    const savedProducts = products.filter(p => p.saved);

    if (savedProducts.length < 2) {
      error = 'Please add at least 2 product seller listing URLs';
      return;
    }

    isLoading = true;
    loadingMessage = `Processing ${savedProducts.length} product${savedProducts.length > 1 ? 's' : ''}...`;

    // Show time estimate if processing multiple products
    if (savedProducts.length > 2) {
      const estimatedSeconds = savedProducts.length * 10; // Rough estimate
      setTimeout(() => {
        if (isLoading) {
          loadingMessage = `Still processing... This may take up to ${Math.ceil(estimatedSeconds / 60)} minute${Math.ceil(estimatedSeconds / 60) > 1 ? 's' : ''}`;
        }
      }, 5000);
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'findCommonSellers',
        productUrls: savedProducts.map(p => p.url)
      });

      if (response.error) {
        error = response.error;
      } else {
        results = response.results;
      }
    } catch (err) {
      error = err.message || 'An error occurred while searching';
    } finally {
      isLoading = false;
      loadingMessage = 'Searching...';
    }
  }
</script>

<div class="popup">
  <div class="header">
    <h1>Allegro Seller Finder</h1>
  </div>

  <div class="content">
    {#if !results}
      <div class="product-list">
        {#each products as product, index (product.id)}
          <div class="product-item">
            <input
              type="text"
              class="product-input"
              placeholder="Paste Allegro seller listing page URL..."
              value={product.url}
              on:input={(e) => updateProduct(index, e.target.value)}
              on:keypress={(e) => handleKeyPress(e, index)}
              disabled={product.saved}
            />
            {#if product.saved}
              <button
                class="icon-btn remove-btn"
                on:click={() => removeProduct(index)}
                title="Remove"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            {:else if product.url.trim()}
              <button
                class="icon-btn add-btn"
                on:click={() => addProduct(index)}
                title="Add"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </button>
            {:else}
              <div class="icon-btn-placeholder"></div>
            {/if}
          </div>
        {/each}
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="actions">
        <button
          class="find-btn"
          on:click={findCommonSellers}
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="spinner"></span>
            {loadingMessage}
          {:else}
            <svg class="search-icon" viewBox="0 0 24 24">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
            Find Common Sellers
          {/if}
        </button>
      </div>
    {:else}
      <div class="results">
        <h2>Sellers Found</h2>
        {#if !results.groupedByFrequency || results.groupedByFrequency.length === 0}
          <p class="no-results">No sellers found.</p>
        {:else}
          <div class="grouped-sellers">
            {#each results.groupedByFrequency as group}
              <div class="frequency-group">
                <div class="frequency-header">
                  {#if group.frequency === group.totalProducts}
                    <span class="badge badge-perfect">All {group.totalProducts} products</span>
                  {:else}
                    <span class="badge">{group.frequency} of {group.totalProducts} products</span>
                  {/if}
                </div>
                <div class="sellers-list">
                  {#each group.sellers as seller}
                    <a href={seller.url} target="_blank" class="seller-link">
                      {seller.name}
                      <svg class="external-icon" viewBox="0 0 24 24">
                        <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                      </svg>
                    </a>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        <button class="back-btn" on:click={() => results = null}>
          <svg viewBox="0 0 24 24">
            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
          </svg>
          Back to Search
        </button>
      </div>
    {/if}
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
  }

  .product-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .product-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .product-input:focus {
    outline: none;
    border-color: #ff6d00;
  }

  .product-input:disabled {
    background: #f5f5f5;
    color: #616161;
    cursor: not-allowed;
  }

  .product-input::placeholder {
    color: #9e9e9e;
  }

  .icon-btn-placeholder {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
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
    width: 24px;
    height: 24px;
    fill: currentColor;
  }

  .add-btn {
    background: #ff6d00;
    color: white;
  }

  .add-btn:hover {
    background: #f57c00;
    box-shadow: 0 2px 8px rgba(255, 109, 0, 0.3);
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
  }

  .find-btn {
    width: 100%;
    padding: 14px 24px;
    background: #ff6d00;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
  }

  .find-btn:hover:not(:disabled) {
    background: #f57c00;
    box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3);
  }

  .find-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .search-icon {
    width: 20px;
    height: 20px;
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

  .results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .results h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #212121;
  }

  .no-results {
    color: #757575;
    font-size: 14px;
    text-align: center;
    padding: 24px;
  }

  .grouped-sellers {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .frequency-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .frequency-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    background: #e0e0e0;
    color: #424242;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge-perfect {
    background: #ff6d00;
    color: white;
  }

  .sellers-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .seller-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f5f5f5;
    border-radius: 4px;
    text-decoration: none;
    color: #212121;
    transition: all 0.2s;
    border-left: 3px solid #ff6d00;
  }

  .seller-link:hover {
    background: #eeeeee;
    transform: translateX(4px);
  }

  .external-icon {
    width: 18px;
    height: 18px;
    fill: #757575;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    background: white;
    color: #424242;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: auto;
    font-family: inherit;
  }

  .back-btn:hover {
    background: #f5f5f5;
    border-color: #bdbdbd;
  }

  .back-btn svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
</style>
