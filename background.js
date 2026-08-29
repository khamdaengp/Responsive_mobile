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

// Handle messages from content scripts and pop-out window
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

  // Handle Pop-out to standalone window request with snug device fitting
  if (message && message.type === 'OPEN_POPOUT_WINDOW') {
    (async () => {
      try {
        const url = message.url || 'https://www.google.com';
        const deviceId = message.device || 'iphone-16-pro';
        const landscape = !!message.isLandscape;

        // Lookup device dimensions
        const DEVICE_DIMENSIONS = {
          'iphone-16-pro': { w: 393, h: 852 },
          'iphone-15-max': { w: 430, h: 932 },
          'iphone-14': { w: 390, h: 844 },
          'iphone-se': { w: 375, h: 667 },
          'galaxy-s24': { w: 360, h: 780 },
          'galaxy-s24-ultra': { w: 412, h: 915 },
          'pixel-8-pro': { w: 412, h: 915 },
          'ipad-mini': { w: 744, h: 1133 },
          'ipad-air': { w: 820, h: 1180 }
        };

        const dims = DEVICE_DIMENSIONS[deviceId] || { w: 393, h: 852 };
        const devW = landscape ? dims.h : dims.w;
        const devH = landscape ? dims.w : dims.h;

        // Pixel-perfect outer window size (frame = dev + 20px, OS window chrome = 16px W / 39px H)
        const targetWidth = Math.min(1600, devW + 20 + 16);
        const targetHeight = Math.min(1050, devH + 20 + 39);

        const viewerUrl = chrome.runtime.getURL(`viewer.html?url=${encodeURIComponent(url)}&device=${encodeURIComponent(deviceId)}&landscape=${landscape}`);
        
        await chrome.windows.create({
          url: viewerUrl,
          type: 'popup',
          width: targetWidth,
          height: targetHeight,
          focused: true
        });
        sendResponse({ success: true });
      } catch (err) {
        console.error('Failed to open pop-out window:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});

// Listen for clicks on the extension action icon in the toolbar -> Directly Open Standalone Pop-out Window
chrome.action.onClicked.addListener(async (tab) => {
  // Ensure rules are applied
  await updateDeviceRule('iOS');

  let targetUrl = 'https://www.google.com';
  if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:') && !tab.url.startsWith('chrome-extension://')) {
    targetUrl = tab.url;
  }

  try {
    const viewerUrl = chrome.runtime.getURL(`viewer.html?url=${encodeURIComponent(targetUrl)}&device=iphone-16-pro&landscape=false`);
    await chrome.windows.create({
      url: viewerUrl,
      type: 'popup',
      width: 850,
      height: 960,
      focused: true
    });
  } catch (err) {
    console.error('[MobileView] Failed to open pop-out window on extension click:', err);
  }
});
