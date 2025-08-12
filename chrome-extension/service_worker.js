// service_worker.js
// Background service worker for the extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('GitHub PR Summarizer extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open();
  }
});
