// Proxy server configuration
// This will be replaced by Vite during build with value from .env
const PROXY_BASE_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3000';

async function findCommonSellers(productUrls) {
  console.log('Finding common sellers via server...');

  // Get API key from storage (optional)
  const { proxyApiKey } = await chrome.storage.local.get(['proxyApiKey']);

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key if configured
    if (proxyApiKey) {
      headers['X-API-Key'] = proxyApiKey;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    // Set timeout to 5 minutes (300000ms) - generous timeout for multiple URLs
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/sellers/find-common`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          urls: productUrls
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error('Server error:', response.status, errorData);
        throw new Error(`Server Error ${response.status}: ${errorData.error || errorData.message || errorData}`);
      }

      const data = await response.json();
      console.log('Server response:', data);

      // Return full response including grouped sellers
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle abort error
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 5 minutes. Try reducing the number of products or check your network connection.');
      }
      throw fetchError;
    }

  } catch (error) {
    // Check if server is running
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to server at ${PROXY_BASE_URL}. Make sure the server is running (npm start in server/ folder)`);
    }
    throw error;
  }
}

// Message listener
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'findCommonSellers') {
    findCommonSellers(request.productUrls)
      .then((results) => {
        sendResponse({ results });
      })
      .catch((error) => {
        console.error('Error finding common sellers:', error);
        sendResponse({ error: error.message });
      });

    return true; // Keep the message channel open for async response
  }
});
