(function() {
  "use strict";
  const PROXY_BASE_URL = "http://localhost:3001";
  async function findCommonSellers(productUrls) {
    console.log("Finding common sellers via server...");
    const { proxyApiKey } = await chrome.storage.local.get(["proxyApiKey"]);
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (proxyApiKey) {
        headers["X-API-Key"] = proxyApiKey;
      }
      const response = await fetch(`${PROXY_BASE_URL}/api/sellers/find-common`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          urls: productUrls
        })
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error("Server error:", response.status, errorData);
        throw new Error(`Server Error ${response.status}: ${errorData.error || errorData.message || errorData}`);
      }
      const data = await response.json();
      console.log("Server response:", data);
      return data;
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error(`Cannot connect to server at ${PROXY_BASE_URL}. Make sure the server is running (npm start in server/ folder)`);
      }
      throw error;
    }
  }
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "findCommonSellers") {
      findCommonSellers(request.productUrls).then((results) => {
        sendResponse({ results });
      }).catch((error) => {
        console.error("Error finding common sellers:", error);
        sendResponse({ error: error.message });
      });
      return true;
    }
  });
})();
//# sourceMappingURL=background.js.map
