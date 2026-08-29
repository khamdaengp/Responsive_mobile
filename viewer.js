/**
 * MobileView — Standalone Pop-out Window Controller
 * Advanced QA Tester & Pentester Developer Suite
 */

(() => {
  // Device Presets Catalog
  const DEVICE_PRESETS = {
    'iphone-16-pro': {
      name: 'iPhone 16 / 15 / 14 Pro',
      width: 393,
      height: 852,
      radius: 48,
      camera: 'island',
      os: 'iOS',
      dpr: '3.00x Super Retina',
      aspect: '19.5 : 9',
      category: 'Apple iPhones'
    },
    'iphone-15-max': {
      name: 'iPhone 15 / 14 Pro Max',
      width: 430,
      height: 932,
      radius: 52,
      camera: 'island',
      os: 'iOS',
      dpr: '3.00x Super Retina',
      aspect: '19.5 : 9',
      category: 'Apple iPhones'
    },
    'iphone-14': {
      name: 'iPhone 14 / 13 / 12',
      width: 390,
      height: 844,
      radius: 46,
      camera: 'notch',
      os: 'iOS',
      dpr: '3.00x Retina',
      aspect: '19.5 : 9',
      category: 'Apple iPhones'
    },
    'iphone-se': {
      name: 'iPhone SE (3rd Gen)',
      width: 375,
      height: 667,
      radius: 26,
      camera: 'tablet',
      os: 'iOS',
      dpr: '2.00x Retina',
      aspect: '16 : 9',
      category: 'Apple iPhones'
    },
    'galaxy-s24': {
      name: 'Samsung Galaxy S24 / S23',
      width: 360,
      height: 780,
      radius: 36,
      camera: 'punch-hole',
      os: 'Android',
      dpr: '3.00x Dynamic AMOLED',
      aspect: '19.5 : 9',
      category: 'Android Flagships'
    },
    'galaxy-s24-ultra': {
      name: 'Samsung Galaxy S24 Ultra',
      width: 412,
      height: 915,
      radius: 22,
      camera: 'punch-hole',
      os: 'Android',
      dpr: '3.50x Quad HD+',
      aspect: '20 : 9',
      category: 'Android Flagships'
    },
    'pixel-8-pro': {
      name: 'Google Pixel 8 Pro / 7',
      width: 412,
      height: 915,
      radius: 40,
      camera: 'punch-hole',
      os: 'Android',
      dpr: '3.50x Super Actua',
      aspect: '20 : 9',
      category: 'Android Flagships'
    },
    'ipad-mini': {
      name: 'iPad Mini (6th Gen)',
      width: 744,
      height: 1133,
      radius: 30,
      camera: 'tablet',
      os: 'iPadOS',
      dpr: '2.00x Liquid Retina',
      aspect: '3 : 2',
      category: 'Tablets'
    },
    'ipad-air': {
      name: 'iPad Air / Pro 11"',
      width: 820,
      height: 1180,
      radius: 34,
      camera: 'tablet',
      os: 'iPadOS',
      dpr: '2.00x Liquid Retina',
      aspect: '4.3 : 3',
      category: 'Tablets'
    }
  };

  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialUrl = urlParams.get('url') || 'https://www.google.com';
  const initialDevice = urlParams.get('device') || 'iphone-16-pro';
  const initialLandscape = urlParams.get('landscape') === 'true';

  // State Management
  let currentDeviceId = DEVICE_PRESETS[initialDevice] ? initialDevice : 'iphone-16-pro';
  let isLandscape = initialLandscape;
  let currentZoomMode = 'auto';
  let isDockMinimized = false;
  let activeLoadedUrl = initialUrl;
  let loadTimeout = null;
  let loadStartTime = 0;
  let customWidth = 393;
  let customHeight = 852;
  let isDarkMode = false;
  let isGridActive = false;
  let isTouchCursorActive = false;

  // DOM Elements
  const frameEl = document.getElementById('mv-frame');
  const stageEl = document.getElementById('mv-stage');
  const cameraContainerEl = document.getElementById('mv-camera-container');
  const iframeEl = document.getElementById('mv-iframe');
  const iframeBoxEl = document.getElementById('mv-iframe-box');
  const loadingEl = document.getElementById('mv-loading');
  const deviceSelectEl = document.getElementById('mv-device-select');
  const zoomSelectEl = document.getElementById('mv-zoom-select');
  const dimensionBadgeEl = document.getElementById('mv-dimension-badge');
  const orientationBtnEl = document.getElementById('mv-orientation-btn');
  const orientationTextEl = document.getElementById('mv-orientation-text');
  const reloadBtnEl = document.getElementById('mv-reload-btn');
  const scrollTopBtnEl = document.getElementById('mv-scroll-top-btn');
  const openNewTabBtnEl = document.getElementById('mv-open-new-tab-btn');
  const urlInputEl = document.getElementById('mv-url-input');
  const urlClearBtnEl = document.getElementById('mv-url-clear-btn');
  const urlGoBtnEl = document.getElementById('mv-url-go-btn');
  const quickChips = document.querySelectorAll('.mv-chip');
  const clockEl = document.getElementById('mv-clock');
  const dockEl = document.getElementById('mv-dock');
  const minimizeBtnEl = document.getElementById('mv-minimize-btn');
  const tabBtns = document.querySelectorAll('.mv-tab-btn');
  const tabPanels = document.querySelectorAll('.mv-tab-panel');

  // Custom dimensions & QA Tools elements
  const customWInput = document.getElementById('mv-custom-w');
  const customHInput = document.getElementById('mv-custom-h');
  const customApplyBtn = document.getElementById('mv-custom-apply-btn');
  const gridOverlayEl = document.getElementById('mv-grid-overlay');
  const gridBtnEl = document.getElementById('mv-grid-btn');
  const touchCursorEl = document.getElementById('mv-touch-cursor');
  const touchBtnEl = document.getElementById('mv-touch-btn');
  const themeBtnEl = document.getElementById('mv-theme-btn');
  const themeTextEl = document.getElementById('mv-theme-text');
  const screenshotBtnEl = document.getElementById('mv-screenshot-btn');
  const protocolBtnEl = document.getElementById('mv-protocol-btn');
  const protocolTextEl = document.getElementById('mv-protocol-text');
  const payloadSelectEl = document.getElementById('mv-payload-select');
  const injectBtnEl = document.getElementById('mv-inject-btn');
  const clearSessionBtnEl = document.getElementById('mv-clear-session-btn');
  const badgeOsEl = document.getElementById('mv-badge-os');
  const valDprEl = document.getElementById('mv-val-dpr');
  const valAspectEl = document.getElementById('mv-val-aspect');
  const hapticBtnEl = document.getElementById('mv-haptic-btn');
  const perfStatusEl = document.getElementById('mv-perf-status');
  const perfTimeEl = document.getElementById('mv-perf-time');
  const secConsoleEl = document.getElementById('mv-sec-console');
  const encoderInput = document.getElementById('mv-encoder-input');
  const encodeUrlBtn = document.getElementById('mv-encode-url-btn');
  const encodeB64Btn = document.getElementById('mv-encode-b64-btn');
  const encoderOut = document.getElementById('mv-encoder-out');

  // Network Elements
  const networkSelectEl = document.getElementById('mv-network-select');
  const netStatusTextEl = document.getElementById('mv-net-status-text');
  const netDotEl = document.getElementById('mv-net-dot');
  const netSpeedEl = document.getElementById('mv-net-speed');
  const netRttEl = document.getElementById('mv-net-rtt');
  const netStreamEl = document.getElementById('mv-net-stream');

  // Network Profiles Definition
  const NETWORK_PROFILES = {
    online: { name: 'Online (Full Speed)', speed: '~25 Mbps', rtt: '15 ms', throttleMs: 0, offline: false },
    fast4g: { name: 'Fast 4G / 5G', speed: '~25 Mbps', rtt: '20 ms', throttleMs: 80, offline: false },
    slow4g: { name: 'Slow 4G / LTE', speed: '~10 Mbps', rtt: '50 ms', throttleMs: 180, offline: false },
    fast3g: { name: 'Fast 3G', speed: '~1.6 Mbps', rtt: '150 ms', throttleMs: 400, offline: false },
    slow3g: { name: 'Slow 3G', speed: '~400 Kbps', rtt: '400 ms', throttleMs: 900, offline: false },
    offline: { name: 'Offline (No Connection)', speed: '0 Kbps', rtt: '∞ ms', throttleMs: 0, offline: true }
  };

  let activeNetProfile = 'online';
  let activeNetFilter = 'all';
  const capturedRequestsMap = new Map();
  let selectedReqId = null;

  // Filter Buttons
  const filterAllBtn = document.getElementById('mv-filter-all');
  const filterFetchBtn = document.getElementById('mv-filter-fetch');
  const filterXhrBtn = document.getElementById('mv-filter-xhr');
  const filterClearBtn = document.getElementById('mv-filter-clear');

  // Network Details Drawer Elements
  const netDrawerEl = document.getElementById('mv-net-drawer');
  const drawerTitleEl = document.getElementById('mv-drawer-title');
  const drawerCloseBtn = document.getElementById('mv-drawer-close');
  const detUrlEl = document.getElementById('mv-det-url');
  const detMethodEl = document.getElementById('mv-det-method');
  const detStatusEl = document.getElementById('mv-det-status');
  const detDurationEl = document.getElementById('mv-det-duration');
  const headersContentEl = document.getElementById('mv-headers-content');
  const payloadContentEl = document.getElementById('mv-payload-content');
  const responseContentEl = document.getElementById('mv-response-content');
  const copyHeadersBtn = document.getElementById('mv-copy-headers-btn');
  const copyPayloadBtn = document.getElementById('mv-copy-payload-btn');
  const copyResponseBtn = document.getElementById('mv-copy-response-btn');
  const netSubtabs = document.querySelectorAll('.mv-net-subtab');
  const netTabPanes = document.querySelectorAll('.mv-net-tab-pane');

  // Network Details Subtab Switching
  netSubtabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      netSubtabs.forEach(t => t.classList.remove('mv-subtab-active'));
      netTabPanes.forEach(p => p.classList.remove('mv-pane-active'));
      tab.classList.add('mv-subtab-active');
      const paneId = tab.getAttribute('data-pane');
      const pane = document.getElementById(paneId);
      if (pane) pane.classList.add('mv-pane-active');
    });
  });

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => {
      if (netDrawerEl) netDrawerEl.classList.remove('mv-open');
      const entries = netStreamEl.querySelectorAll('.mv-log-entry');
      entries.forEach(e => e.classList.remove('mv-selected'));
      selectedReqId = null;
    });
  }

  // Helper to format JSON safely
  function formatJsonSafe(str) {
    if (!str) return '';
    try {
      if (typeof str === 'object') return JSON.stringify(str, null, 2);
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return String(str);
    }
  }

  // Display request details in drawer
  function showRequestDetails(reqId) {
    const data = capturedRequestsMap.get(reqId);
    if (!data) return;

    selectedReqId = reqId;
    if (netDrawerEl) netDrawerEl.classList.add('mv-open');

    // Highlight row
    const entries = netStreamEl.querySelectorAll('.mv-log-entry');
    entries.forEach(e => {
      if (e.getAttribute('data-id') === reqId) {
        e.classList.add('mv-selected');
      } else {
        e.classList.remove('mv-selected');
      }
    });

    if (drawerTitleEl) {
      drawerTitleEl.textContent = `${data.method} ${data.url}`;
    }

    if (detUrlEl) detUrlEl.textContent = data.fullUrl || data.url;
    if (detMethodEl) detMethodEl.textContent = `${data.method} (${data.reqType})`;
    if (detStatusEl) detStatusEl.textContent = `${data.status} ${data.statusText || ''}`;
    if (detDurationEl) detDurationEl.textContent = `${data.duration} ms`;

    // Render Headers
    if (headersContentEl) {
      let headersHtml = `
        <div class="mv-net-kv-row"><span class="mv-net-key">Request URL:</span><span class="mv-net-val">${data.fullUrl || data.url}</span></div>
        <div class="mv-net-kv-row"><span class="mv-net-key">Request Method:</span><span class="mv-net-val">${data.method}</span></div>
        <div class="mv-net-kv-row"><span class="mv-net-key">Status Code:</span><span class="mv-net-val">${data.status} ${data.statusText || ''}</span></div>
        <div class="mv-net-kv-row"><span class="mv-net-key">Duration:</span><span class="mv-net-val">${data.duration} ms</span></div>
      `;

      if (data.requestHeaders && Object.keys(data.requestHeaders).length > 0) {
        headersHtml += `<div style="margin-top: 6px; font-weight: bold; color: #94a3b8; font-size: 9px; text-transform: uppercase;">Request Headers:</div>`;
        Object.entries(data.requestHeaders).forEach(([k, v]) => {
          headersHtml += `<div class="mv-net-kv-row"><span class="mv-net-key">${k}:</span><span class="mv-net-val">${v}</span></div>`;
        });
      }

      if (data.responseHeaders && Object.keys(data.responseHeaders).length > 0) {
        headersHtml += `<div style="margin-top: 6px; font-weight: bold; color: #94a3b8; font-size: 9px; text-transform: uppercase;">Response Headers:</div>`;
        Object.entries(data.responseHeaders).forEach(([k, v]) => {
          headersHtml += `<div class="mv-net-kv-row"><span class="mv-net-key">${k}:</span><span class="mv-net-val">${v}</span></div>`;
        });
      }

      headersContentEl.innerHTML = headersHtml;
    }

    // Render Payload
    if (payloadContentEl) {
      if (data.requestPayload) {
        payloadContentEl.textContent = formatJsonSafe(data.requestPayload);
      } else {
        payloadContentEl.textContent = '(No payload / body sent with this request)';
      }
    }

    // Render Response
    if (responseContentEl) {
      if (data.responseBody) {
        responseContentEl.textContent = formatJsonSafe(data.responseBody);
      } else {
        responseContentEl.textContent = '(Empty response body)';
      }
    }
  }

  // Copy helper
  function setupCopyBtn(btn, getContentFn) {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const content = getContentFn();
      if (!content) return;
      navigator.clipboard.writeText(content);
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = originalText; }, 1500);
    });
  }

  setupCopyBtn(copyHeadersBtn, () => {
    if (!selectedReqId) return '';
    const data = capturedRequestsMap.get(selectedReqId);
    if (!data) return '';
    return JSON.stringify({
      url: data.fullUrl || data.url,
      method: data.method,
      status: data.status,
      duration: data.duration,
      requestHeaders: data.requestHeaders,
      responseHeaders: data.responseHeaders
    }, null, 2);
  });

  setupCopyBtn(copyPayloadBtn, () => {
    if (!selectedReqId) return '';
    const data = capturedRequestsMap.get(selectedReqId);
    return data?.requestPayload ? formatJsonSafe(data.requestPayload) : '';
  });

  setupCopyBtn(copyResponseBtn, () => {
    if (!selectedReqId) return '';
    const data = capturedRequestsMap.get(selectedReqId);
    return data?.responseBody ? formatJsonSafe(data.responseBody) : '';
  });

  function applyNetFilter() {
    if (!netStreamEl) return;
    const entries = netStreamEl.querySelectorAll('.mv-log-entry');
    entries.forEach((entry) => {
      const type = entry.getAttribute('data-type') || 'DOC';
      if (activeNetFilter === 'all') {
        entry.style.display = 'flex';
      } else if (activeNetFilter === 'fetch' && type === 'FETCH') {
        entry.style.display = 'flex';
      } else if (activeNetFilter === 'xhr' && type === 'XHR') {
        entry.style.display = 'flex';
      } else {
        entry.style.display = 'none';
      }
    });
  }

  function setFilter(filterName, activeBtn) {
    activeNetFilter = filterName;
    [filterAllBtn, filterFetchBtn, filterXhrBtn].forEach(b => b?.classList.remove('mv-chip-active'));
    activeBtn?.classList.add('mv-chip-active');
    applyNetFilter();
  }

  filterAllBtn?.addEventListener('click', () => setFilter('all', filterAllBtn));
  filterFetchBtn?.addEventListener('click', () => setFilter('fetch', filterFetchBtn));
  filterXhrBtn?.addEventListener('click', () => setFilter('xhr', filterXhrBtn));
  filterClearBtn?.addEventListener('click', () => {
    if (netStreamEl) netStreamEl.innerHTML = '';
    capturedRequestsMap.clear();
    if (netDrawerEl) netDrawerEl.classList.remove('mv-open');
    selectedReqId = null;
  });

  // Live Network Stream Logger
  function logNetworkEvent(tag, message, type = 'info', reqType = 'DOC', reqId = null) {
    if (!netStreamEl) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    let tagClass = 'mv-log-tag-info';
    if (type === 'pass') tagClass = 'mv-log-tag-pass';
    else if (type === 'warn') tagClass = 'mv-log-tag-warn';
    else if (reqType === 'XHR') tagClass = 'mv-log-tag-xhr';
    else if (reqType === 'FETCH') tagClass = 'mv-log-tag-fetch';
    
    const entry = document.createElement('div');
    entry.className = `mv-log-entry ${reqId ? 'mv-clickable' : ''}`;
    entry.setAttribute('data-type', reqType);
    if (reqId) entry.setAttribute('data-id', reqId);

    entry.innerHTML = `
      <span class="mv-log-time">${timeStr}</span>
      <span class="${tagClass}">[${tag}]</span>
      <span style="word-break: break-all; flex: 1;">${message}</span>
      ${reqId ? '<span style="font-size: 8px; color: #64748b;">🔍</span>' : ''}
    `;

    if (reqId) {
      entry.addEventListener('click', () => {
        showRequestDetails(reqId);
      });
    }

    netStreamEl.appendChild(entry);
    netStreamEl.scrollTop = netStreamEl.scrollHeight;
    applyNetFilter();
  }

  // Intercept incoming Fetch / XHR traffic from iframe
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'MOBILEVIEW_NETWORK_REQ' && e.data.data) {
      const data = e.data.data;
      const { id, reqType, method, url, status, duration } = data;
      const reqId = id || ('req_' + Date.now() + '_' + Math.random());
      capturedRequestsMap.set(reqId, { ...data, id: reqId });

      const statusType = status >= 200 && status < 300 ? 'pass' : (status >= 400 ? 'warn' : 'info');
      const label = `${reqType} ${method}`;
      const detail = `${url} (${status} · ${duration}ms)`;
      logNetworkEvent(label, detail, statusType, reqType, reqId);
      logSecurityEvent(reqType, `${method} ${url.substring(0, 30)} (${status})`, statusType);
    }
  });

  // Network Profile Change Handler
  if (networkSelectEl) {
    networkSelectEl.addEventListener('change', (e) => {
      activeNetProfile = e.target.value;
      const prof = NETWORK_PROFILES[activeNetProfile] || NETWORK_PROFILES.online;

      if (prof.offline) {
        netDotEl.classList.add('mv-offline');
        netStatusTextEl.textContent = 'Offline (Disconnected)';
        netSpeedEl.textContent = '0 Kbps';
        netRttEl.textContent = '∞ ms';
        iframeEl.src = 'about:blank';
        logNetworkEvent('NET', 'Simulated Network Disconnected (Offline)', 'warn');
        logSecurityEvent('OFFLINE', 'Network throttler severed connectivity', 'warn');
      } else {
        netDotEl.classList.remove('mv-offline');
        netStatusTextEl.textContent = `${prof.name} Active`;
        netSpeedEl.textContent = prof.speed;
        netRttEl.textContent = prof.rtt;
        logNetworkEvent('THROTTLE', `Profile changed to ${prof.name}`, 'pass');
        logSecurityEvent('NET', `Throttling set to ${prof.name}`, 'info');
        if (iframeEl.src === 'about:blank' || !iframeEl.src) {
          reloadIframe();
        }
      }
    });
  }

  // Security Console Logging
  function logSecurityEvent(tag, message, type = 'info') {
    if (!secConsoleEl) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const tagClass = type === 'pass' ? 'mv-log-tag-pass' : type === 'warn' ? 'mv-log-tag-warn' : 'mv-log-tag-info';
    
    const entry = document.createElement('div');
    entry.className = 'mv-log-entry';
    entry.innerHTML = `
      <span class="mv-log-time">${timeStr}</span>
      <span class="${tagClass}">[${tag}]</span>
      <span>${message}</span>
    `;
    secConsoleEl.appendChild(entry);
    secConsoleEl.scrollTop = secConsoleEl.scrollHeight;
  }

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('mv-tab-active'));
      tabPanels.forEach((p) => p.classList.remove('mv-panel-active'));
      btn.classList.add('mv-tab-active');
      const targetPanelId = btn.getAttribute('data-tab');
      const panel = document.getElementById(targetPanelId);
      if (panel) panel.classList.add('mv-panel-active');
    });
  });

  // Normalize URL
  function normalizeUrl(input) {
    let url = (input || '').trim();
    if (!url) return '';

    if (/^(https?:\/\/)?(www\.)?google\.com(\/.*)?$/i.test(url)) {
      const path = url.replace(/^(https?:\/\/)?(www\.)?google\.com/i, '');
      url = 'https://www.google.com' + (path || '/');
    } else if (/^(https?:\/\/)?(www\.)?facebook\.com(\/.*)?$/i.test(url) || /^fb\.com(\/.*)?$/i.test(url)) {
      const path = url.replace(/^(https?:\/\/)?(www\.)?facebook\.com/i, '').replace(/^fb\.com/i, '');
      url = 'https://m.facebook.com' + (path || '/');
    } else if (/^(https?:\/\/)?(www\.)?youtube\.com(\/.*)?$/i.test(url)) {
      const path = url.replace(/^(https?:\/\/)?(www\.)?youtube\.com/i, '');
      url = 'https://m.youtube.com' + (path || '/');
    } else if (!/^https?:\/\//i.test(url)) {
      if (/^localhost(:\d+)?/i.test(url) || /^127\.0\.0\.1(:\d+)?/i.test(url)) {
        url = 'http://' + url;
      } else {
        url = 'https://' + url;
      }
    }
    return url;
  }

  // Populate Device Selector
  const categories = {};
  Object.entries(DEVICE_PRESETS).forEach(([id, dev]) => {
    if (!categories[dev.category]) categories[dev.category] = [];
    categories[dev.category].push({ id, ...dev });
  });

  Object.entries(categories).forEach(([categoryName, devices]) => {
    const optGroup = document.createElement('optgroup');
    optGroup.label = categoryName;
    devices.forEach((dev) => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.textContent = `${dev.name} (${dev.width} × ${dev.height})`;
      optGroup.appendChild(opt);
    });
    deviceSelectEl.appendChild(optGroup);
  });
  deviceSelectEl.value = currentDeviceId;

  // Render Camera Element
  function renderCameraElement(cameraType) {
    if (cameraType === 'island') {
      cameraContainerEl.innerHTML = `
        <div class="mv-dynamic-island">
          <div class="mv-camera-lens"></div>
          <div class="mv-island-sensor"></div>
        </div>
      `;
    } else if (cameraType === 'notch') {
      cameraContainerEl.innerHTML = `
        <div class="mv-notch">
          <div class="mv-speaker-grille"></div>
          <div class="mv-camera-lens"></div>
        </div>
      `;
    } else if (cameraType === 'punch-hole') {
      cameraContainerEl.innerHTML = `
        <div class="mv-punch-hole">
          <div class="mv-camera-lens"></div>
        </div>
      `;
    } else {
      cameraContainerEl.innerHTML = `<div class="mv-tablet-camera"></div>`;
    }
  }

  // Update Status Clock
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    clockEl.textContent = `${hours}:${formattedMinutes}`;
  }

  // Auto-resize the actual Chrome window to fit device + dock snugly
  async function fitWindowToDevice() {
    try {
      const device = DEVICE_PRESETS[currentDeviceId] || { width: customWidth, height: customHeight, os: 'Custom' };
      const devW = isLandscape ? device.height : device.width;
      const devH = isLandscape ? device.width : device.height;
      const frameTotalWidth = devW + 20; // 10px border on each side
      const frameTotalHeight = devH + 20;
      const extraDockWidth = isDockMinimized ? 0 : 400;

      // Detect OS window border overhead
      const osChromeWidth = Math.max(0, window.outerWidth - window.innerWidth) || 16;
      const osChromeHeight = Math.max(0, window.outerHeight - window.innerHeight) || 39;

      const maxAllowedWidth = screen.availWidth;
      const maxAllowedHeight = screen.availHeight;

      const targetWidth = Math.min(maxAllowedWidth, frameTotalWidth + extraDockWidth + osChromeWidth);
      const targetHeight = Math.min(maxAllowedHeight, frameTotalHeight + osChromeHeight);

      const currentWin = await chrome.windows.getCurrent();
      if (currentWin && currentWin.id) {
        await chrome.windows.update(currentWin.id, {
          width: Math.round(targetWidth),
          height: Math.round(targetHeight)
        });
      }
    } catch (e) {}
  }

  // Calculate Layout & Scaling
  function applyDeviceLayout() {
    const device = DEVICE_PRESETS[currentDeviceId] || {
      name: 'Custom Viewport',
      width: customWidth,
      height: customHeight,
      radius: 36,
      camera: 'punch-hole',
      os: 'Custom',
      dpr: '3.00x Custom',
      aspect: 'Custom'
    };

    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;

    frameEl.style.width = `${width}px`;
    frameEl.style.height = `${height}px`;
    frameEl.style.borderRadius = `${device.radius || 36}px`;

    if (customWInput) customWInput.value = width;
    if (customHInput) customHInput.value = height;

    if (isLandscape) {
      frameEl.classList.add('mv-landscape');
      orientationBtnEl.classList.add('mv-btn-active');
      orientationTextEl.textContent = 'Landscape';
    } else {
      frameEl.classList.remove('mv-landscape');
      orientationBtnEl.classList.remove('mv-btn-active');
      orientationTextEl.textContent = 'Portrait';
    }

    dimensionBadgeEl.textContent = `${width} × ${height} px (${device.os})`;
    if (badgeOsEl) badgeOsEl.textContent = `${device.os} Engine`;
    if (valDprEl) valDprEl.textContent = device.dpr || '3.00x Super Retina';
    if (valAspectEl) valAspectEl.textContent = isLandscape ? 'Landscape Mode' : (device.aspect || '19.5 : 9');

    renderCameraElement(device.camera);

    // Sync device OS User-Agent
    try {
      chrome.runtime.sendMessage({ type: 'SET_DEVICE_OS', os: device.os });
    } catch (e) {}

    calculateScale(width, height);
    fitWindowToDevice();
  }

  function calculateScale(deviceWidth, deviceHeight) {
    const frameTotalWidth = deviceWidth + 20;
    const frameTotalHeight = deviceHeight + 20;

    const occupiedDockWidth = isDockMinimized ? 0 : 400;
    const availWidth = Math.max(10, window.innerWidth - occupiedDockWidth);
    const availHeight = window.innerHeight;

    let scale = 1;
    if (currentZoomMode === 'auto') {
      if (isDockMinimized) {
        scale = availWidth / frameTotalWidth;
      } else {
        const scaleX = availWidth / frameTotalWidth;
        const scaleY = availHeight / frameTotalHeight;
        scale = Math.min(scaleX, scaleY);
      }
      scale = Math.max(0.25, scale);
    } else {
      scale = parseInt(currentZoomMode, 10) / 100;
    }

    const scaledHeight = frameTotalHeight * scale;
    const topOffset = Math.max(0, (window.innerHeight - scaledHeight) / 2);

    stageEl.style.transformOrigin = 'top center';
    stageEl.style.transform = `translateY(${topOffset.toFixed(1)}px) scale(${scale.toFixed(4)})`;
  }

  // Load URL
  function loadUrl(targetUrl) {
    const cleanUrl = normalizeUrl(targetUrl);
    if (!cleanUrl) return;

    loadStartTime = performance.now();
    activeLoadedUrl = cleanUrl;
    urlInputEl.value = cleanUrl;
    urlClearBtnEl.style.display = 'flex';

    if (protocolTextEl) {
      protocolTextEl.textContent = cleanUrl.startsWith('https') ? 'HTTPS' : 'HTTP';
    }

    loadingEl.classList.add('mv-active');
    logSecurityEvent('LOAD', `Navigating to ${cleanUrl.substring(0, 36)}...`, 'info');
    logNetworkEvent('GET', `${cleanUrl.substring(0, 32)} — Fetching Document`, 'info');

    const prof = NETWORK_PROFILES[activeNetProfile] || NETWORK_PROFILES.online;
    const throttleDelay = prof.throttleMs || 0;

    if (loadTimeout) clearTimeout(loadTimeout);
    loadTimeout = setTimeout(() => {
      loadingEl.classList.remove('mv-active');
      if (perfStatusEl) perfStatusEl.textContent = '200 OK (Streamed)';
      if (perfTimeEl) perfTimeEl.textContent = `${Math.round(performance.now() - loadStartTime)} ms`;
    }, 3500 + throttleDelay);

    if (throttleDelay > 0) {
      setTimeout(() => {
        iframeEl.src = cleanUrl;
      }, throttleDelay);
    } else {
      iframeEl.src = cleanUrl;
    }
  }

  function reloadIframe() {
    loadingEl.classList.add('mv-active');
    loadStartTime = performance.now();
    const currentSrc = activeLoadedUrl || iframeEl.src || 'https://www.google.com';
    iframeEl.src = 'about:blank';
    requestAnimationFrame(() => {
      iframeEl.src = currentSrc;
      logSecurityEvent('RELOAD', 'Refreshed mobile viewport', 'info');
      logNetworkEvent('RELOAD', 'Re-fetching cache & assets', 'info');
    });
  }

  // Toggle Minimize to Fixed Corner Bubble
  function toggleDockMinimize() {
    isDockMinimized = !isDockMinimized;
    if (isDockMinimized) {
      dockEl.classList.add('mv-minimized');
    } else {
      dockEl.classList.remove('mv-minimized');
    }
    const device = DEVICE_PRESETS[currentDeviceId] || { width: customWidth, height: customHeight };
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;
    calculateScale(width, height);
    fitWindowToDevice();
  }

  // Event Listeners
  if (minimizeBtnEl) {
    minimizeBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDockMinimize();
    });
  }

  dockEl.addEventListener('click', () => {
    if (isDockMinimized) {
      toggleDockMinimize();
    }
  });

  iframeEl.addEventListener('load', () => {
    loadingEl.classList.remove('mv-active');
    if (loadTimeout) clearTimeout(loadTimeout);
    const duration = Math.round(performance.now() - loadStartTime);
    if (perfStatusEl) perfStatusEl.textContent = '200 OK (Complete)';
    if (perfTimeEl) perfTimeEl.textContent = `${duration} ms`;
    logSecurityEvent('HTTP', `Page rendered in ${duration}ms`, 'pass');
    logNetworkEvent('200 OK', `DOM Assets Loaded (${duration}ms)`, 'pass');
  });

  urlGoBtnEl.addEventListener('click', () => {
    loadUrl(urlInputEl.value);
  });

  urlInputEl.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      loadUrl(urlInputEl.value);
    }
  });

  urlInputEl.addEventListener('input', () => {
    urlClearBtnEl.style.display = urlInputEl.value ? 'flex' : 'none';
  });

  urlClearBtnEl.addEventListener('click', () => {
    urlInputEl.value = '';
    urlClearBtnEl.style.display = 'none';
    urlInputEl.focus();
  });

  quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      loadUrl(chip.getAttribute('data-url'));
    });
  });

  deviceSelectEl.addEventListener('change', (e) => {
    currentDeviceId = e.target.value;
    applyDeviceLayout();
  });

  orientationBtnEl.addEventListener('click', () => {
    isLandscape = !isLandscape;
    applyDeviceLayout();
  });

  zoomSelectEl.addEventListener('change', (e) => {
    currentZoomMode = e.target.value;
    const device = DEVICE_PRESETS[currentDeviceId] || { width: customWidth, height: customHeight };
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;
    calculateScale(width, height);
  });

  reloadBtnEl.addEventListener('click', reloadIframe);

  scrollTopBtnEl.addEventListener('click', () => {
    try {
      if (iframeEl.contentDocument) {
        iframeEl.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        iframeEl.contentWindow.postMessage({ type: 'SCROLL_TOP' }, '*');
      }
    } catch {}
  });

  openNewTabBtnEl.addEventListener('click', () => {
    window.open(activeLoadedUrl || iframeEl.src, '_blank');
  });

  // Custom Dimensions Apply
  if (customApplyBtn) {
    customApplyBtn.addEventListener('click', () => {
      const w = parseInt(customWInput.value, 10);
      const h = parseInt(customHInput.value, 10);
      if (w >= 200 && h >= 200) {
        customWidth = w;
        customHeight = h;
        currentDeviceId = 'custom';
        applyDeviceLayout();
        logSecurityEvent('RESIZE', `Custom resolution: ${w} × ${h} px`, 'info');
      }
    });
  }

  // Grid Overlay Toggle
  if (gridBtnEl) {
    gridBtnEl.addEventListener('click', () => {
      isGridActive = !isGridActive;
      gridOverlayEl.classList.toggle('mv-grid-active', isGridActive);
      gridBtnEl.classList.toggle('mv-btn-active', isGridActive);
    });
  }

  // Simulated Tap / Touch Feedback Indicator
  let touchFadeTimeout = null;

  if (touchBtnEl) {
    touchBtnEl.addEventListener('click', () => {
      isTouchCursorActive = !isTouchCursorActive;
      touchBtnEl.classList.toggle('mv-btn-active', isTouchCursorActive);
      if (!isTouchCursorActive) {
        touchCursorEl.style.display = 'none';
        touchCursorEl.classList.remove('mv-touching');
      }
    });
  }

  // Tap feedback on click / tap (Does NOT follow cursor continuously)
  if (iframeBoxEl) {
    iframeBoxEl.addEventListener('mousedown', (e) => {
      if (!isTouchCursorActive) return;
      const rect = iframeBoxEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      touchCursorEl.style.left = `${clickX}px`;
      touchCursorEl.style.top = `${clickY}px`;
      touchCursorEl.style.display = 'block';
      touchCursorEl.classList.add('mv-touching');

      if (touchFadeTimeout) clearTimeout(touchFadeTimeout);
    });

    iframeBoxEl.addEventListener('mouseup', () => {
      if (!isTouchCursorActive) return;
      touchFadeTimeout = setTimeout(() => {
        touchCursorEl.classList.remove('mv-touching');
        setTimeout(() => {
          if (!touchCursorEl.classList.contains('mv-touching')) {
            touchCursorEl.style.display = 'none';
          }
        }, 200);
      }, 250);
    });

    iframeBoxEl.addEventListener('mouseleave', () => {
      touchCursorEl.classList.remove('mv-touching');
      touchCursorEl.style.display = 'none';
    });
  }

  // Dark / Light Theme Toggle
  if (themeBtnEl) {
    themeBtnEl.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      themeTextEl.textContent = isDarkMode ? 'Mode: Dark Theme' : 'Mode: Light Theme';
      themeBtnEl.classList.toggle('mv-btn-active', isDarkMode);
      try {
        iframeEl.contentWindow.postMessage({ type: 'SET_COLOR_SCHEME', scheme: isDarkMode ? 'dark' : 'light' }, '*');
      } catch (e) {}
    });
  }

  // Haptic Feedback Vibration Simulator
  if (hapticBtnEl) {
    hapticBtnEl.addEventListener('click', () => {
      frameEl.classList.add('mv-shaking');
      if (navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => {
        frameEl.classList.remove('mv-shaking');
      }, 300);
      logSecurityEvent('HAPTIC', 'Triggered device vibration pulse', 'info');
    });
  }

  // Protocol Switcher (HTTPS ↔ HTTP)
  if (protocolBtnEl) {
    protocolBtnEl.addEventListener('click', () => {
      if (!activeLoadedUrl) return;
      if (activeLoadedUrl.startsWith('https://')) {
        loadUrl(activeLoadedUrl.replace('https://', 'http://'));
      } else if (activeLoadedUrl.startsWith('http://')) {
        loadUrl(activeLoadedUrl.replace('http://', 'https://'));
      }
    });
  }

  // Payload Encoders
  if (encodeUrlBtn && encoderInput) {
    encodeUrlBtn.addEventListener('click', () => {
      const val = encoderInput.value || '';
      encoderOut.textContent = encodeURIComponent(val);
    });
  }

  if (encodeB64Btn && encoderInput) {
    encodeB64Btn.addEventListener('click', () => {
      const val = encoderInput.value || '';
      try {
        encoderOut.textContent = btoa(val);
      } catch (e) {
        encoderOut.textContent = 'Encoding error (non-ASCII)';
      }
    });
  }

  // Pentest Payload Injector
  if (injectBtnEl) {
    injectBtnEl.addEventListener('click', () => {
      const payload = payloadSelectEl.value;
      const baseUrl = activeLoadedUrl || 'https://www.google.com';
      const separator = baseUrl.includes('?') ? '&' : '?';
      const cleanPayload = payload.startsWith('?') ? payload.substring(1) : payload;
      const target = baseUrl + separator + cleanPayload;
      logSecurityEvent('INJECT', `Testing payload: ${cleanPayload}`, 'warn');
      loadUrl(target);
    });
  }

  // Clear Session & Cache
  if (clearSessionBtnEl) {
    clearSessionBtnEl.addEventListener('click', () => {
      try {
        iframeEl.src = 'about:blank';
        logSecurityEvent('CLEAR', 'Session and cache reset', 'pass');
        setTimeout(() => {
          reloadIframe();
        }, 150);
      } catch (e) {}
    });
  }

  // Screenshot / Snapshot
  if (screenshotBtnEl) {
    screenshotBtnEl.addEventListener('click', () => {
      window.print();
    });
  }

  // Keybindings
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleDockMinimize();
    } else if (e.key === 'o' || e.key === 'O') {
      isLandscape = !isLandscape;
      applyDeviceLayout();
    } else if (e.key === 'r' || e.key === 'R') {
      reloadIframe();
    }
  });

  window.addEventListener('resize', () => {
    const device = DEVICE_PRESETS[currentDeviceId] || { width: customWidth, height: customHeight };
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;
    calculateScale(width, height);
  });

  // Init
  updateClock();
  setInterval(updateClock, 10000);
  applyDeviceLayout();
  loadUrl(initialUrl);
})();
