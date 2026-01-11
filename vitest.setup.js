import { vi } from 'vitest';
import { afterEach } from 'vitest';

// Mock Chrome API - set on both global and window for browser extension compatibility
const chromeMock = {
  runtime: {
    onMessage: {
      addListener: vi.fn()
    },
    sendMessage: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  }
};

global.chrome = chromeMock;
// Also set on window since browser extensions access chrome from window
if (typeof window !== 'undefined') {
  window.chrome = chromeMock;
}

// Cleanup after each test
afterEach(() => {
  document.body.innerHTML = '';
});
