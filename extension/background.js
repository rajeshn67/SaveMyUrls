const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['apiBaseUrl'], ({ apiBaseUrl }) => {
    if (!apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: DEFAULT_API_BASE_URL });
    }
  });
});
