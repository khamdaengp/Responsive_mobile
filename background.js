/**
 * Background Service Worker for Responsive Mobile Viewport & Mockup Tester
 * Manifest V3 compatible with Declarative Net Request for un-framing & mobile spoofing
 */

const USER_AGENTS = {
  iOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iPadOS: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  Android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
};

// Distinct HTTP response headers to strip for seamless iframe preview
const RESPONSE_HEADERS_TO_REMOVE = [
  { header: 'x-frame-options', operation: 'remove' },
  { header: 'frame-options', operation: 'remove' },
  { header: 'content-security-policy', operation: 'remove' },
  { header: 'content-security-policy-report-only', operation: 'remove' },
  { header: 'cross-origin-embedder-policy', operation: 'remove' },
  { header: 'cross-origin-opener-policy', operation: 'remove' },
  { header: 'cross-origin-resource-policy', operation: 'remove' }
];

async function updateDeviceRule(osType = 'iOS') {
  const ua = USER_AGENTS[osType] || USER_AGENTS.iOS;
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [100],
      addRules: [
        {
          id: 100,
          priority: 10,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'user-agent', operation: 'set', value: ua },
              { header: 'sec-fetch-dest', operation: 'set', value: 'document' },
              { header: 'sec-fetch-mode', operation: 'set', value: 'navigate' },
              { header: 'sec-fetch-site', operation: 'set', value: 'none' },
              { header: 'sec-fetch-user', operation: 'set', value: '?1' },
              { header: 'referer', operation: 'remove' }
            ],
            responseHeaders: RESPONSE_HEADERS_TO_REMOVE
          },
          condition: {
            urlFilter: '|http*',
            resourceTypes: ['sub_frame']
          }
        }
      ]
    });
    console.log(`[MobileView] DNR rules active with ${osType} User-Agent.`);
  } catch (err) {
    console.error('[MobileView] Failed to update dynamic DNR rules:', err);
  }
}

// Ensure rules are registered immediately on extension startup/install
chrome.runtime.onInstalled.addListener(() => {
  updateDeviceRule('iOS');
});

chrome.runtime.onStartup.addListener(() => {
  updateDeviceRule('iOS');
});

// Update rules immediately on worker wake-up
updateDeviceRule('iOS');

// Handle messages from content scripts (e.g. changing device OS)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'SET_DEVICE_OS') {
    (async () => {
      try {
        await updateDeviceRule(message.os);
        sendResponse({ success: true, os: message.os });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});

// Listen for clicks on the extension action icon in the toolbar
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  // Ensure rules are applied
  await updateDeviceRule('iOS');

  // Guard against internal browser schemes where content scripts cannot execute
  const restrictedProtocols = [
    'chrome:',
    'chrome-extension:',
    'edge:',
    'devtools:',
    'about:',
    'view-source:'
  ];

  if (
    !tab.url ||
    restrictedProtocols.some((proto) => tab.url.startsWith(proto)) ||
    tab.url.includes('chromewebstore.google.com') ||
    tab.url.includes('chrome.google.com/webstore')
  ) {
    console.warn('Responsive Preview cannot run on internal or restricted browser pages.');
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'MV_TOGGLE_OVERLAY' });
    if (!response || !response.success) {
      throw new Error('Content script not active');
    }
  } catch (err) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (injectionError) {
      console.error('Failed to inject Responsive Mockup content script:', injectionError);
    }
  }
});
