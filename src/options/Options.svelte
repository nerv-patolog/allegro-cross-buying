<script>
  import { onMount } from 'svelte';

  let proxyApiKey = '';
  let saved = false;
  let error = '';

  onMount(async () => {
    const stored = await chrome.storage.local.get(['proxyApiKey']);
    if (stored.proxyApiKey) {
      proxyApiKey = stored.proxyApiKey;
    }
  });

  async function saveSettings() {
    error = '';
    saved = false;

    // API key is optional
    try {
      await chrome.storage.local.set({
        proxyApiKey: proxyApiKey.trim()
      });
      saved = true;
      setTimeout(() => {
        saved = false;
      }, 3000);
    } catch (err) {
      error = 'Failed to save settings';
    }
  }

  function clearSettings() {
    proxyApiKey = '';
    chrome.storage.local.remove(['proxyApiKey']);
  }
</script>

<div class="options">
  <div class="header">
    <h1>Allegro Seller Finder Settings</h1>
  </div>

  <div class="content">
    <div class="section">
      <h2>Proxy Server Configuration</h2>
      <p class="description">
        This extension uses a local Node.js proxy server to communicate with the Allegro API. The
        proxy server must be running on your computer for the extension to work.
      </p>

      <div class="form-group">
        <label for="proxyApiKey">Proxy API Key (Optional)</label>
        <input
          id="proxyApiKey"
          type="password"
          class="input"
          bind:value={proxyApiKey}
          placeholder="Enter API key if configured in server/.env..."
        />
        <p class="hint">
          If you set an API_KEY in your server/.env file, enter it here. Otherwise, leave this field
          empty.
        </p>
      </div>

      {#if error}
        <div class="message error">{error}</div>
      {/if}

      {#if saved}
        <div class="message success">Settings saved successfully!</div>
      {/if}

      <div class="actions">
        <button class="btn primary" on:click={saveSettings}>
          <svg viewBox="0 0 24 24">
            <path
              d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"
            />
          </svg>
          Save Settings
        </button>
        <button class="btn secondary" on:click={clearSettings}> Clear </button>
      </div>
    </div>

    <div class="section">
      <h2>How to Set Up the Proxy Server</h2>
      <ol class="steps">
        <li>Open a terminal in the extension directory</li>
        <li>Navigate to the server folder: <code>cd server</code></li>
        <li>Copy .env.example to .env: <code>cp .env.example .env</code></li>
        <li>
          Edit .env and add your Allegro API credentials from
          <a href="https://apps.developer.allegro.pl/" target="_blank">Allegro Developer Portal</a>
        </li>
        <li>Install dependencies: <code>npm install</code></li>
        <li>Start the server: <code>npm start</code></li>
        <li>The server will run at http://localhost:3000</li>
      </ol>
    </div>

    <div class="section">
      <h2>About</h2>
      <p class="about-text">
        This extension helps you find common sellers across multiple Allegro products, making it
        easier to optimize your shopping cart and avoid delivery fees by reaching the 45 PLN minimum
        order per seller.
      </p>
    </div>
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
    background: #f5f5f5;
  }

  .options {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
  }

  .header {
    background: #ff6d00;
    color: white;
    padding: 24px 32px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 500;
  }

  .content {
    padding: 32px;
  }

  .section {
    margin-bottom: 40px;
  }

  .section h2 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 500;
    color: #212121;
  }

  .description {
    color: #757575;
    font-size: 14px;
    margin: 0 0 24px 0;
    line-height: 1.6;
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #424242;
    font-size: 14px;
  }

  .input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .input:focus {
    outline: none;
    border-color: #ff6d00;
  }

  .hint {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: #757575;
  }

  .message {
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .message.error {
    background: #ffebee;
    color: #c62828;
    border-left: 4px solid #c62828;
  }

  .message.success {
    background: #e8f5e9;
    color: #2e7d32;
    border-left: 4px solid #2e7d32;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: inherit;
  }

  .btn svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .btn.primary {
    background: #ff6d00;
    color: white;
  }

  .btn.primary:hover {
    background: #f57c00;
    box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3);
  }

  .btn.secondary {
    background: white;
    color: #424242;
    border: 1px solid #e0e0e0;
  }

  .btn.secondary:hover {
    background: #f5f5f5;
    border-color: #bdbdbd;
  }

  .steps {
    margin: 16px 0;
    padding-left: 24px;
    color: #424242;
  }

  .steps li {
    margin-bottom: 12px;
    line-height: 1.6;
  }

  .steps a {
    color: #ff6d00;
    text-decoration: none;
  }

  .steps a:hover {
    text-decoration: underline;
  }

  .steps code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #d32f2f;
  }

  .about-text {
    color: #616161;
    line-height: 1.6;
    margin: 0;
  }
</style>
