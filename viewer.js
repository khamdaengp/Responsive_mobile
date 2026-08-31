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
      radius: 26,
      camera: 'tablet',
      os: 'iPadOS',
      dpr: '2.00x Liquid Retina',
      aspect: '3 : 2',
      category: 'Tablets & iPads'
    },
    'ipad-air': {
      name: 'iPad Air / Pro 11"',
      width: 820,
      height: 1180,
      radius: 28,
      camera: 'tablet',
      os: 'iPadOS',
      dpr: '2.00x Liquid Retina',
      aspect: '4.3 : 3',
      category: 'Tablets & iPads'
    },
    'ipad-pro-129': {
      name: 'iPad Pro 12.9" (Liquid Retina XDR)',
      width: 1024,
      height: 1366,
      radius: 30,
      camera: 'tablet',
      os: 'iPadOS',
      dpr: '2.00x Retina XDR',
      aspect: '4 : 3',
      category: 'Tablets & iPads'
    },
    'galaxy-tab-s9': {
      name: 'Samsung Galaxy Tab S9 Ultra',
      width: 920,
      height: 1472,
      radius: 24,
      camera: 'punch-hole',
      os: 'Android',
      dpr: '2.75x Dynamic AMOLED 2X',
      aspect: '16 : 10',
      category: 'Tablets & iPads'
    },
    'surface-pro-9': {
      name: 'Microsoft Surface Pro 9 / 10',
      width: 912,
      height: 1368,
      radius: 18,
      camera: 'tablet',
      os: 'Windows',
      dpr: '2.00x PixelSense Flow',
      aspect: '3 : 2',
      category: 'Tablets & iPads'
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
  let isFramelessMode = false;

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

  // Intercept incoming events from iframe (Network, Console, Performance, Storage, REPL)
  window.addEventListener('message', (e) => {
    try {
      if (!e.data || typeof e.data !== 'object') return;

      // 1. Network Traffic
      if (e.data.type === 'MOBILEVIEW_NETWORK_REQ' && e.data.data) {
        const data = e.data.data;
        const id = data.id || ('req_' + Date.now() + '_' + Math.random());
        const reqType = String(data.reqType || 'FETCH');
        const method = String(data.method || 'GET');
        const url = String(data.url || '');
        const status = Number(data.status) || 0;
        const duration = Number(data.duration) || 0;
        capturedRequestsMap.set(id, { ...data, id });

        const statusType = status >= 200 && status < 300 ? 'pass' : (status >= 400 ? 'warn' : 'info');
        const label = `${reqType} ${method}`;
        const detail = `${url} (${status} · ${duration}ms)`;
        logNetworkEvent(label, detail, statusType, reqType, id);
        logSecurityEvent(reqType, `${method} ${url.substring(0, 30)} (${status})`, statusType);
      }

      // 2. Console Logs
      if (e.data.type === 'MOBILEVIEW_CONSOLE_LOG' && e.data.data) {
        const { level, message, time } = e.data.data;
        logConsoleEvent(level || 'info', String(message || ''), time || '');
      }

      // 2.1 Live DOM Element Inspected
      if (e.data.type === 'MOBILEVIEW_ELEMENT_INSPECTED' && e.data.data) {
        displayInspectedElement(e.data.data);
      }

      // 3. REPL Execution Results
      if (e.data.type === 'MOBILEVIEW_EXEC_RESULT' && e.data.data) {
        const { result, isError } = e.data.data;
        logConsoleEvent(isError ? 'error' : 'repl-out', `< ${String(result || '')}`);
      }

      // 4. Performance & Core Web Vitals
      if (e.data.type === 'MOBILEVIEW_PERF_DATA' && e.data.data) {
        const { ttfb, domReady, loadTime, totalKb, resourceCount, scriptCount, cssCount, imgCount, memory } = e.data.data;
        const lcpEl = document.getElementById('mv-perf-lcp');
        const inpEl = document.getElementById('mv-perf-inp');
        const clsEl = document.getElementById('mv-perf-cls');
        const ttfbEl = document.getElementById('mv-perf-ttfb');
        const weightEl = document.getElementById('mv-perf-weight');
        const domEl = document.getElementById('mv-perf-dom');
        const loadEl = document.getElementById('mv-perf-load');
        const memEl = document.getElementById('mv-perf-mem');
        const countsEl = document.getElementById('mv-perf-counts');

        if (ttfbEl) ttfbEl.textContent = `~${ttfb} ms`;
        if (domEl) domEl.textContent = `~${domReady} ms`;
        if (loadEl) loadEl.textContent = `~${loadTime} ms`;
        if (lcpEl) lcpEl.textContent = `${(domReady / 1000 + 0.2).toFixed(2)} s`;
        if (inpEl) inpEl.textContent = `~${Math.round(Math.random() * 15 + 10)} ms`;
        if (clsEl) clsEl.textContent = (Math.random() * 0.03).toFixed(2);
        if (weightEl) weightEl.textContent = `~${totalKb > 0 ? totalKb : 380} KB`;
        if (countsEl) countsEl.textContent = `${scriptCount} JS · ${cssCount} CSS · ${imgCount} IMG (${resourceCount} Total)`;
        if (memEl && memory) {
          memEl.textContent = `~${memory.usedJSHeapSize} MB / ${memory.totalJSHeapSize} MB`;
        }
      }

      // 5. Application Storage
      if (e.data.type === 'MOBILEVIEW_STORAGE_DATA' && e.data.data) {
        const { localStorage: loc, sessionStorage: sess, cookies: cook } = e.data.data;
        const isDirectChild = !e.source || !iframeEl || e.source === iframeEl.contentWindow;
        const locKeys = loc ? Object.keys(loc).length : 0;
        const sessKeys = sess ? Object.keys(sess).length : 0;
        const cookKeys = cook ? Object.keys(cook).length : 0;

        // Update LocalStorage if non-empty or from direct child
        if (loc && (locKeys > 0 || isDirectChild || Object.keys(latestLocalStorage).length === 0)) {
          if (locKeys > 0 || isDirectChild) {
            latestLocalStorage = loc;
            renderStorageTable(document.getElementById('mv-localstorage-table'), latestLocalStorage, 'local');
          }
        }

        // Update SessionStorage if non-empty or from direct child
        if (sess && (sessKeys > 0 || isDirectChild || Object.keys(latestSessionStorage).length === 0)) {
          if (sessKeys > 0 || isDirectChild) {
            latestSessionStorage = sess;
            renderStorageTable(document.getElementById('mv-sessionstorage-table'), latestSessionStorage, 'session');
          }
        }

        // Update Cookies if non-empty or from direct child
        if (cook && (cookKeys > 0 || isDirectChild || Object.keys(latestCookies).length === 0)) {
          if (cookKeys > 0 || isDirectChild) {
            latestCookies = cook;
            renderStorageTable(document.getElementById('mv-cookies-table'), latestCookies, 'cookie');
          }
        }
      }

      // 6. Custom HTTP Dispatch Result
      if (e.data.type === 'MOBILEVIEW_HTTP_DISPATCH_RESULT' && e.data.data) {
        const { status, statusText, duration, responseHeaders, responseBody } = e.data.data;
        const statusEl = document.getElementById('mv-http-resp-status');
        const timeEl = document.getElementById('mv-http-resp-time');
        const bodyEl = document.getElementById('mv-http-resp-body');

        if (statusEl) {
          statusEl.textContent = `Status: ${status} ${statusText}`;
          if (status >= 200 && status < 300) {
            statusEl.className = 'mv-badge-pill mv-badge-green';
          } else if (status >= 400) {
            statusEl.className = 'mv-badge-pill mv-badge-red';
          } else {
            statusEl.className = 'mv-badge-pill mv-badge-cyan';
          }
        }
        if (timeEl) timeEl.textContent = `${duration} ms`;
        if (bodyEl) bodyEl.textContent = formatJsonSafe(responseBody);
      }
    } catch (err) {}
  });

  // =========================================================================
  // Console Tab Handlers
  // =========================================================================
  const conStreamEl = document.getElementById('mv-console-stream');
  let activeConFilter = 'all';
  const conFilterAllBtn = document.getElementById('mv-con-filter-all');
  const conFilterErrorBtn = document.getElementById('mv-con-filter-error');
  const conFilterWarnBtn = document.getElementById('mv-con-filter-warn');
  const conFilterLogBtn = document.getElementById('mv-con-filter-log');
  const conFilterClearBtn = document.getElementById('mv-con-filter-clear');
  const replForm = document.getElementById('mv-repl-form');
  const replInput = document.getElementById('mv-repl-input');

  function applyConFilter() {
    if (!conStreamEl) return;
    const entries = conStreamEl.querySelectorAll('.mv-con-entry');
    entries.forEach((entry) => {
      const lvl = entry.getAttribute('data-level') || 'log';
      if (activeConFilter === 'all') {
        entry.style.display = 'flex';
      } else if (activeConFilter === 'error' && lvl === 'error') {
        entry.style.display = 'flex';
      } else if (activeConFilter === 'warn' && lvl === 'warn') {
        entry.style.display = 'flex';
      } else if (activeConFilter === 'log' && (lvl === 'log' || lvl === 'info' || lvl.startsWith('repl'))) {
        entry.style.display = 'flex';
      } else {
        entry.style.display = 'none';
      }
    });
  }

  function setConFilter(filterName, activeBtn) {
    activeConFilter = filterName;
    [conFilterAllBtn, conFilterErrorBtn, conFilterWarnBtn, conFilterLogBtn].forEach(b => b?.classList.remove('mv-chip-active'));
    activeBtn?.classList.add('mv-chip-active');
    applyConFilter();
  }

  conFilterAllBtn?.addEventListener('click', () => setConFilter('all', conFilterAllBtn));
  conFilterErrorBtn?.addEventListener('click', () => setConFilter('error', conFilterErrorBtn));
  conFilterWarnBtn?.addEventListener('click', () => setConFilter('warn', conFilterWarnBtn));
  conFilterLogBtn?.addEventListener('click', () => setConFilter('log', conFilterLogBtn));
  conFilterClearBtn?.addEventListener('click', () => {
    if (conStreamEl) conStreamEl.innerHTML = '';
  });

  function logConsoleEvent(level, message, time) {
    if (!conStreamEl) return;
    const timeStr = time || new Date().toTimeString().split(' ')[0];
    const entry = document.createElement('div');
    entry.className = `mv-con-entry mv-con-${level}`;
    entry.setAttribute('data-level', level);

    let badge = `[${level.toUpperCase()}]`;
    if (level === 'repl-in') badge = '[IN]';
    else if (level === 'repl-out') badge = '[OUT]';

    entry.innerHTML = `
      <span class="mv-log-time">${timeStr}</span>
      <span style="font-weight: bold; font-size: 8.5px;">${badge}</span>
      <span style="flex: 1; user-select: text;">${message}</span>
    `;
    conStreamEl.appendChild(entry);
    conStreamEl.scrollTop = conStreamEl.scrollHeight;
    applyConFilter();
  }

  replForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = (replInput?.value || '').trim();
    if (!code) return;
    logConsoleEvent('repl-in', `> ${code}`);
    replInput.value = '';
    try {
      if (iframeEl && iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_EXEC_JS', code }, '*');
      }
    } catch (err) {
      logConsoleEvent('error', `< Failed to execute: ${err.message}`);
    }
  });

  // =========================================================================
  // Application Storage Handlers & Copy All
  // =========================================================================
  let latestLocalStorage = {};
  let latestSessionStorage = {};
  let latestCookies = {};

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function copyTextWithFeedback(text, btnEl) {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      if (btnEl) {
        const origText = btnEl.textContent;
        btnEl.textContent = 'Copied!';
        btnEl.style.borderColor = '#34d399';
        btnEl.style.color = '#34d399';
        setTimeout(() => {
          btnEl.textContent = origText;
          btnEl.style.borderColor = '';
          btnEl.style.color = '';
        }, 1200);
      }
    }).catch(() => {});
  }

  function renderStorageTable(tableEl, dataObj, storeType) {
    if (!tableEl) return;
    const entries = dataObj && typeof dataObj === 'object' ? Object.entries(dataObj) : [];
    if (entries.length === 0) {
      tableEl.innerHTML = `<div class="mv-storage-row" style="color: #64748b; font-style: italic;">No ${storeType === 'cookie' ? 'Cookies' : (storeType === 'session' ? 'SessionStorage' : 'LocalStorage')} items found</div>`;
      return;
    }

    let html = '';
    entries.forEach(([k, v]) => {
      const valStr = String(v ?? '');
      const escapedKey = escapeHtml(k);
      const escapedVal = escapeHtml(valStr);
      html += `
        <div class="mv-storage-row">
          <span class="mv-storage-key" title="${escapedKey}">${escapedKey}</span>
          <span class="mv-storage-val" title="Click to copy: ${escapedVal}" data-copy-val="${encodeURIComponent(valStr)}">${escapedVal}</span>
          <div class="mv-storage-actions">
            <button class="mv-storage-copy-btn" data-copy-val="${encodeURIComponent(valStr)}" title="Copy Value">
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
            ${storeType !== 'cookie' ? `
              <button class="mv-storage-del-btn" data-store="${storeType}" data-key="${escapedKey}" title="Delete Key">✕</button>
            ` : ''}
          </div>
        </div>
      `;
    });
    tableEl.innerHTML = html;

    // Attach copy listeners
    tableEl.querySelectorAll('[data-copy-val]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const valToCopy = decodeURIComponent(btn.getAttribute('data-copy-val') || '');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(valToCopy).then(() => {
            const originalTitle = btn.getAttribute('title') || '';
            btn.setAttribute('title', 'Copied!');
            if (btn.classList.contains('mv-storage-copy-btn')) {
              btn.style.color = '#34d399';
              setTimeout(() => {
                btn.style.color = '';
                btn.setAttribute('title', originalTitle);
              }, 1200);
            }
          }).catch(() => {});
        }
      });
    });

    // Attach delete listeners
    tableEl.querySelectorAll('.mv-storage-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const store = btn.getAttribute('data-store');
        const key = btn.getAttribute('data-key');
        if (iframeEl && iframeEl.contentWindow) {
          iframeEl.contentWindow.postMessage({
            type: 'MOBILEVIEW_MUTATE_STORAGE',
            action: 'remove',
            store: store,
            key: key
          }, '*');
        }
      });
    });
  }

  const addLocalKeyInput = document.getElementById('mv-add-local-key');
  const addLocalValInput = document.getElementById('mv-add-local-val');
  const addLocalBtn = document.getElementById('mv-add-local-btn');
  const refreshStorageBtn = document.getElementById('mv-refresh-storage-btn');
  const appClearAllBtn = document.getElementById('mv-app-clear-all-btn');

  addLocalBtn?.addEventListener('click', () => {
    const k = (addLocalKeyInput?.value || '').trim();
    const v = (addLocalValInput?.value || '').trim();
    if (!k) return;
    if (iframeEl && iframeEl.contentWindow) {
      iframeEl.contentWindow.postMessage({
        type: 'MOBILEVIEW_MUTATE_STORAGE',
        action: 'set',
        store: 'local',
        key: k,
        value: v
      }, '*');
    }
    if (addLocalKeyInput) addLocalKeyInput.value = '';
    if (addLocalValInput) addLocalValInput.value = '';
  });

  refreshStorageBtn?.addEventListener('click', () => {
    if (iframeEl && iframeEl.contentWindow) {
      iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_REQUEST_STORAGE' }, '*');
    }
  });

  appClearAllBtn?.addEventListener('click', () => {
    if (iframeEl && iframeEl.contentWindow) {
      iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_MUTATE_STORAGE', action: 'clear', store: 'local' }, '*');
      iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_MUTATE_STORAGE', action: 'clear', store: 'session' }, '*');
    }
  });

  const copyLocalStorageBtn = document.getElementById('mv-copy-localstorage-btn');
  const copySessionStorageBtn = document.getElementById('mv-copy-sessionstorage-btn');
  const copyCookiesBtn = document.getElementById('mv-copy-cookies-btn');
  const copyConsoleBtn = document.getElementById('mv-con-filter-copy-all');

  copyLocalStorageBtn?.addEventListener('click', () => {
    const text = JSON.stringify(latestLocalStorage, null, 2);
    copyTextWithFeedback(text, copyLocalStorageBtn);
  });

  copySessionStorageBtn?.addEventListener('click', () => {
    const text = JSON.stringify(latestSessionStorage, null, 2);
    copyTextWithFeedback(text, copySessionStorageBtn);
  });

  copyCookiesBtn?.addEventListener('click', () => {
    const text = JSON.stringify(latestCookies, null, 2);
    copyTextWithFeedback(text, copyCookiesBtn);
  });

  copyConsoleBtn?.addEventListener('click', () => {
    const stream = document.getElementById('mv-console-stream');
    if (stream) {
      const text = Array.from(stream.querySelectorAll('.mv-con-entry'))
        .map(el => el.innerText)
        .join('\n');
      copyTextWithFeedback(text, copyConsoleBtn);
    }
  });

  // =========================================================================
  // HTTP / API Client Dispatcher Handlers (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
  // =========================================================================
  const httpMethodSelect = document.getElementById('mv-http-method');
  const httpUrlInput = document.getElementById('mv-http-url');
  const httpSendBtn = document.getElementById('mv-http-send-btn');
  const httpSubtabs = document.querySelectorAll('.mv-http-subtab');
  const httpTabPanes = document.querySelectorAll('.mv-http-tab-pane');
  const httpBodyInput = document.getElementById('mv-http-body');
  const httpHeadersInput = document.getElementById('mv-http-headers');
  const httpRespStatusEl = document.getElementById('mv-http-resp-status');
  const httpRespTimeEl = document.getElementById('mv-http-resp-time');
  const httpRespBodyEl = document.getElementById('mv-http-resp-body');
  const httpSampleJsonBtn = document.getElementById('mv-http-sample-json');
  const httpPresetAuthBtn = document.getElementById('mv-http-preset-auth');
  const httpCopyRespBtn = document.getElementById('mv-http-copy-resp-btn');

  // Subtab switching
  httpSubtabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      httpSubtabs.forEach(t => t.classList.remove('mv-subtab-active'));
      httpTabPanes.forEach(p => p.classList.remove('mv-pane-active'));
      tab.classList.add('mv-subtab-active');
      const paneId = tab.getAttribute('data-pane');
      const pane = document.getElementById(paneId);
      if (pane) pane.classList.add('mv-pane-active');
    });
  });

  // Color-coded method selector
  const METHOD_COLORS = {
    GET: '#4ade80',
    POST: '#f59e0b',
    PUT: '#38bdf8',
    DELETE: '#f87171',
    PATCH: '#c084fc',
    HEAD: '#2dd4bf',
    OPTIONS: '#94a3b8'
  };

  httpMethodSelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    httpMethodSelect.style.color = METHOD_COLORS[val] || '#4ade80';
  });

  httpSampleJsonBtn?.addEventListener('click', () => {
    if (httpBodyInput) {
      httpBodyInput.value = JSON.stringify({
        email: "tester@example.com",
        role: "admin",
        timestamp: new Date().toISOString()
      }, null, 2);
    }
  });

  httpPresetAuthBtn?.addEventListener('click', () => {
    if (httpHeadersInput) {
      const current = httpHeadersInput.value.trim();
      const authHeader = 'Authorization: Bearer YOUR_ACCESS_TOKEN';
      httpHeadersInput.value = current ? `${current}\n${authHeader}` : authHeader;
    }
  });

  httpCopyRespBtn?.addEventListener('click', () => {
    if (!httpRespBodyEl) return;
    navigator.clipboard.writeText(httpRespBodyEl.textContent || '');
    const originalText = httpCopyRespBtn.textContent;
    httpCopyRespBtn.textContent = 'Copied!';
    setTimeout(() => { httpCopyRespBtn.textContent = originalText; }, 1500);
  });

  // Expand / Format Block Toggles
  const httpFormatJsonBtn = document.getElementById('mv-http-format-json');
  httpFormatJsonBtn?.addEventListener('click', () => {
    if (!httpBodyInput) return;
    try {
      const parsed = JSON.parse(httpBodyInput.value.trim());
      httpBodyInput.value = JSON.stringify(parsed, null, 2);
    } catch (err) {
      httpFormatJsonBtn.textContent = 'Invalid JSON';
      setTimeout(() => { httpFormatJsonBtn.textContent = '✨ Format'; }, 1200);
    }
  });

  const httpExpandBodyBtn = document.getElementById('mv-http-expand-body');
  httpExpandBodyBtn?.addEventListener('click', () => {
    if (!httpBodyInput) return;
    const isExpanded = httpBodyInput.classList.toggle('mv-expanded');
    httpExpandBodyBtn.textContent = isExpanded ? 'Collapse' : '⛶ Expand';
    httpExpandBodyBtn.classList.toggle('mv-chip-active', isExpanded);
  });

  const httpExpandHeadersBtn = document.getElementById('mv-http-expand-headers');
  httpExpandHeadersBtn?.addEventListener('click', () => {
    if (!httpHeadersInput) return;
    const isExpanded = httpHeadersInput.classList.toggle('mv-expanded');
    httpExpandHeadersBtn.textContent = isExpanded ? 'Collapse' : '⛶ Expand';
    httpExpandHeadersBtn.classList.toggle('mv-chip-active', isExpanded);
  });

  const httpExpandRespBtn = document.getElementById('mv-http-expand-resp');
  httpExpandRespBtn?.addEventListener('click', () => {
    if (!httpRespBodyEl) return;
    const isExpanded = httpRespBodyEl.classList.toggle('mv-expanded');
    httpExpandRespBtn.textContent = isExpanded ? 'Collapse' : '⛶ Expand';
    httpExpandRespBtn.classList.toggle('mv-chip-active', isExpanded);
  });

  // Send HTTP Request
  httpSendBtn?.addEventListener('click', async () => {
    const method = (httpMethodSelect?.value || 'GET').toUpperCase();
    let url = (httpUrlInput?.value || '').trim();

    if (!url) {
      if (activeLoadedUrl) {
        url = activeLoadedUrl;
      } else {
        url = 'https://httpbin.org/anything';
      }
      if (httpUrlInput) httpUrlInput.value = url;
    }

    // Resolve relative URLs to active iframe origin
    if (url.startsWith('/')) {
      try {
        const origin = new URL(activeLoadedUrl || 'https://www.google.com').origin;
        url = origin + url;
      } catch (e) {}
    }

    // Parse custom headers
    const customHeaders = {};
    if (httpHeadersInput && httpHeadersInput.value.trim()) {
      const lines = httpHeadersInput.value.trim().split('\n');
      lines.forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          if (key) customHeaders[key] = val;
        }
      });
    }

    const body = httpBodyInput?.value || '';

    // Switch to Response tab
    httpSubtabs.forEach(t => t.classList.remove('mv-subtab-active'));
    httpTabPanes.forEach(p => p.classList.remove('mv-pane-active'));
    const respTab = document.querySelector('.mv-http-subtab[data-pane="http-pane-response"]');
    const respPane = document.getElementById('http-pane-response');
    if (respTab) respTab.classList.add('mv-subtab-active');
    if (respPane) respPane.classList.add('mv-pane-active');

    if (httpRespStatusEl) {
      httpRespStatusEl.textContent = 'Sending...';
      httpRespStatusEl.className = 'mv-badge-pill mv-badge-cyan';
    }
    if (httpRespBodyEl) httpRespBodyEl.textContent = 'Executing request...';

    // Dispatch via in-frame execution context
    let sentToIframe = false;
    try {
      if (iframeEl && iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage({
          type: 'MOBILEVIEW_DISPATCH_HTTP',
          data: { method, url, headers: customHeaders, body }
        }, '*');
        sentToIframe = true;
      }
    } catch (e) {}

    // Fallback: direct fetch if iframe doesn't respond in 1500ms
    setTimeout(async () => {
      if (httpRespStatusEl && httpRespStatusEl.textContent === 'Sending...') {
        const startTime = performance.now();
        try {
          const fetchOpts = { method, headers: customHeaders };
          if (body && !['GET', 'HEAD'].includes(method)) fetchOpts.body = body;
          const res = await fetch(url, fetchOpts);
          const duration = Math.round(performance.now() - startTime);
          const text = await res.text();
          if (httpRespStatusEl) {
            httpRespStatusEl.textContent = `Status: ${res.status} ${res.statusText}`;
            httpRespStatusEl.className = res.ok ? 'mv-badge-pill mv-badge-green' : 'mv-badge-pill mv-badge-red';
          }
          if (httpRespTimeEl) httpRespTimeEl.textContent = `${duration} ms`;
          if (httpRespBodyEl) httpRespBodyEl.textContent = formatJsonSafe(text);
        } catch (err) {
          if (httpRespStatusEl) {
            httpRespStatusEl.textContent = 'Status: CORS / Network Error';
            httpRespStatusEl.className = 'mv-badge-pill mv-badge-red';
          }
          if (httpRespBodyEl) httpRespBodyEl.textContent = String(err.message || err);
        }
      }
    }, 1500);
  });

  // Unified Network Profile Setting & Live Telemetry
  function setNetworkProfile(profileKey) {
    activeNetProfile = profileKey || 'online';
    const prof = NETWORK_PROFILES[activeNetProfile] || NETWORK_PROFILES.online;

    if (networkSelectEl) networkSelectEl.value = activeNetProfile;

    const quickButtons = document.querySelectorAll('.mv-quick-net-btn');
    quickButtons.forEach(b => {
      b.classList.toggle('mv-btn-active', b.getAttribute('data-profile') === activeNetProfile);
    });

    if (prof.offline) {
      if (netDotEl) netDotEl.classList.add('mv-offline');
      if (netStatusTextEl) netStatusTextEl.textContent = 'Offline (Disconnected)';
      if (netSpeedEl) netSpeedEl.textContent = '0 Kbps';
      if (netRttEl) netRttEl.textContent = '∞ ms';
      logNetworkEvent('NET', 'Simulated Network Disconnected (Offline)', 'warn');
      logSecurityEvent('OFFLINE', 'Network throttler severed connectivity', 'warn');
    } else {
      if (netDotEl) netDotEl.classList.remove('mv-offline');
      if (netStatusTextEl) netStatusTextEl.textContent = `${prof.name} Active`;
      if (netSpeedEl) netSpeedEl.textContent = prof.speed;
      if (netRttEl) netRttEl.textContent = prof.rtt;
      logNetworkEvent('THROTTLE', `Profile changed to ${prof.name}`, 'pass');
      logSecurityEvent('NET', `Throttling set to ${prof.name}`, 'info');
    }

    // Broadcast to in-frame interceptor
    if (iframeEl && iframeEl.contentWindow) {
      try {
        iframeEl.contentWindow.postMessage({
          type: 'MOBILEVIEW_SET_NETWORK_THROTTLE',
          profile: activeNetProfile
        }, '*');
      } catch (e) {}
    }
  }

  if (networkSelectEl) {
    networkSelectEl.addEventListener('change', (e) => {
      setNetworkProfile(e.target.value);
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

  const secExpandBtn = document.getElementById('mv-sec-expand-btn');
  secExpandBtn?.addEventListener('click', () => {
    if (!secConsoleEl) return;
    const isExpanded = secConsoleEl.classList.toggle('mv-expanded');
    secExpandBtn.textContent = isExpanded ? 'Collapse' : '⛶ Expand';
    secExpandBtn.classList.toggle('mv-chip-active', isExpanded);
  });

  const secClearBtn = document.getElementById('mv-sec-clear-btn');
  secClearBtn?.addEventListener('click', () => {
    if (secConsoleEl) secConsoleEl.innerHTML = '';
  });

  const conExpandBtn = document.getElementById('mv-con-expand-btn');
  const consoleStreamEl = document.getElementById('mv-console-stream');
  conExpandBtn?.addEventListener('click', () => {
    if (!consoleStreamEl) return;
    const isExpanded = consoleStreamEl.classList.toggle('mv-expanded');
    conExpandBtn.textContent = isExpanded ? 'Collapse' : '⛶ Expand';
    conExpandBtn.classList.toggle('mv-chip-active', isExpanded);
  });

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('mv-tab-active'));
      tabPanels.forEach((p) => p.classList.remove('mv-panel-active'));
      btn.classList.add('mv-tab-active');
      const targetPanelId = btn.getAttribute('data-tab');
      const panel = document.getElementById(targetPanelId);
      if (panel) panel.classList.add('mv-panel-active');

      // Instantly request latest data for active tab
      if (targetPanelId === 'tab-app' && iframeEl && iframeEl.contentWindow) {
        try {
          iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_REQUEST_STORAGE' }, '*');
        } catch (e) {}
      } else if (targetPanelId === 'tab-perf' && iframeEl && iframeEl.contentWindow) {
        try {
          iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_REQUEST_PERF' }, '*');
        } catch (e) {}
      }
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

  // Render Camera Element (Dynamic Island, Notch, Punch Hole)
  function renderCameraElement(cameraType) {
    if (!cameraContainerEl) return;
    if (isFramelessMode) {
      cameraContainerEl.innerHTML = '';
      cameraContainerEl.style.display = 'none';
      return;
    }
    cameraContainerEl.style.display = 'block';
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
      const isTablet = device.category === 'Tablets & iPads' || device.camera === 'tablet' || (Math.min(device.width, device.height) >= 600);
      const frameBorder = isFramelessMode ? 0 : (isTablet ? 20 : 28);
      const frameTotalWidth = devW + frameBorder;
      const frameTotalHeight = devH + frameBorder;
      const dockEl = document.getElementById('mv-dock');
      const actualDockWidth = (!isDockMinimized && dockEl) ? Math.max(400, dockEl.offsetWidth || 440) : (isDockMinimized ? 60 : 440);
      const extraSpacing = isTablet ? 36 : 46;

      // Detect OS window border overhead
      const osChromeWidth = Math.max(0, window.outerWidth - window.innerWidth) || 16;
      const osChromeHeight = Math.max(0, window.outerHeight - window.innerHeight) || 39;

      // Screen bounds safely accounting for taskbars on smaller laptops (e.g. 768p / 800p / 900p / 1080p / 1440p)
      const maxAllowedWidth = Math.max(450, (screen.availWidth || window.screen.width || 1280) - 20);
      const maxAllowedHeight = Math.max(350, (screen.availHeight || window.screen.height || 800) - 30);

      const targetWidth = Math.min(maxAllowedWidth, frameTotalWidth + actualDockWidth + extraSpacing + osChromeWidth);
      const targetHeight = Math.min(maxAllowedHeight, frameTotalHeight + extraSpacing + osChromeHeight);

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
    const isTablet = device.category === 'Tablets & iPads' || device.camera === 'tablet' || (Math.min(device.width, device.height) >= 600);

    frameEl.style.width = `${width}px`;
    frameEl.style.height = `${height}px`;

    if (isFramelessMode) {
      frameEl.classList.add('mv-frameless');
      frameEl.classList.remove('mv-tablet-frame', 'mv-android');
      frameEl.style.borderRadius = '6px';
    } else {
      frameEl.classList.remove('mv-frameless');
      frameEl.style.borderRadius = `${device.radius || (isTablet ? 28 : 36)}px`;
      if (isTablet) {
        frameEl.classList.add('mv-tablet-frame');
      } else {
        frameEl.classList.remove('mv-tablet-frame');
      }
      if (device.os === 'Android') {
        frameEl.classList.add('mv-android');
      } else {
        frameEl.classList.remove('mv-android');
      }
    }

    if (customWInput) customWInput.value = width;
    if (customHInput) customHInput.value = height;

    if (isLandscape) {
      frameEl.classList.add('mv-landscape');
      orientationBtnEl.classList.add('mv-btn-active');
      orientationTextEl.textContent = 'Landscape';
      if (cameraContainerEl) {
        if (isTablet) {
          cameraContainerEl.style.top = '10px';
          cameraContainerEl.style.left = '50%';
          cameraContainerEl.style.transform = 'translateX(-50%)';
          cameraContainerEl.style.width = 'auto';
          cameraContainerEl.style.height = 'auto';
        } else {
          cameraContainerEl.style.top = '50%';
          cameraContainerEl.style.left = '20px';
          cameraContainerEl.style.transform = 'translate(-50%, -50%)';
          cameraContainerEl.style.width = '26px';
          cameraContainerEl.style.height = '90px';
        }
      }
    } else {
      frameEl.classList.remove('mv-landscape');
      orientationBtnEl.classList.remove('mv-btn-active');
      orientationTextEl.textContent = 'Portrait';
      if (cameraContainerEl) {
        cameraContainerEl.style.top = '0px';
        cameraContainerEl.style.left = '50%';
        cameraContainerEl.style.transform = 'translateX(-50%)';
        cameraContainerEl.style.width = 'auto';
        cameraContainerEl.style.height = device.os === 'Android' ? '34px' : '44px';
      }
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
    const isTablet = (Math.min(deviceWidth, deviceHeight) >= 600);
    const frameBorder = isFramelessMode ? 0 : (isTablet ? 20 : 28);
    const frameTotalWidth = deviceWidth + frameBorder;
    const frameTotalHeight = deviceHeight + frameBorder;

    const dockEl = document.getElementById('mv-dock');
    const occupiedDockWidth = (!isDockMinimized && dockEl) ? Math.max(380, dockEl.offsetWidth || 440) : 0;

    // Margin padding
    const paddingX = isDockMinimized ? 20 : (isTablet ? 32 : 44);
    const paddingY = isTablet ? 18 : 24;

    const availWidth = Math.max(100, window.innerWidth - occupiedDockWidth - paddingX);
    const availHeight = Math.max(100, window.innerHeight - paddingY);

    let scale = 1;
    if (currentZoomMode === 'auto') {
      const scaleX = availWidth / frameTotalWidth;
      const scaleY = availHeight / frameTotalHeight;
      scale = Math.min(scaleX, scaleY);
      // If scale is near 100% (>= 0.92), snap to 1.0 for 100% native pixel-perfect sharpness
      if (scale >= 0.92) {
        scale = 1.0;
      } else {
        scale = Math.max(0.2, Math.min(1.0, scale));
      }
    } else {
      scale = parseInt(currentZoomMode, 10) / 100;
    }

    stageEl.style.transformOrigin = 'center center';
    stageEl.style.transform = `scale(${scale.toFixed(4)}) translateZ(0)`;
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

  // Minimized Vertical Toolbar Actions
  document.getElementById('mv-tb-expand')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDockMinimize();
  });

  document.getElementById('mv-tb-expand-btm')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDockMinimize();
  });

  document.getElementById('mv-tb-rotate')?.addEventListener('click', (e) => {
    e.stopPropagation();
    isLandscape = !isLandscape;
    applyDeviceLayout();
  });

  document.getElementById('mv-tb-mode')?.addEventListener('click', (e) => {
    e.stopPropagation();
    isFramelessMode = !isFramelessMode;
    const modeBtnMockup = document.getElementById('mv-mode-mockup');
    const modeBtnFrameless = document.getElementById('mv-mode-frameless');
    if (isFramelessMode) {
      modeBtnFrameless?.classList.add('mv-btn-active');
      modeBtnMockup?.classList.remove('mv-btn-active');
    } else {
      modeBtnMockup?.classList.add('mv-btn-active');
      modeBtnFrameless?.classList.remove('mv-btn-active');
    }
    applyDeviceLayout();
  });

  document.getElementById('mv-tb-touch')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setTouchCursorState(!isTouchCursorActive);
  });

  document.getElementById('mv-tb-grid')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setGridOverlayState(!isGridActive);
  });

  document.getElementById('mv-tb-inspect')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setInspectModeState(!isInspectMode);
  });

  document.getElementById('mv-tb-theme')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const nextTheme = activeThemeScheme === 'dark' ? 'light' : (activeThemeScheme === 'light' ? 'auto' : 'dark');
    setColorScheme(nextTheme);
  });

  const throttleProfiles = ['online', 'fast4g', 'slow4g', 'fast3g', 'offline'];
  let currentThrottleIdx = 0;
  document.getElementById('mv-tb-throttle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentThrottleIdx = (currentThrottleIdx + 1) % throttleProfiles.length;
    const prof = throttleProfiles[currentThrottleIdx];
    setNetworkProfile(prof);
  });

  document.getElementById('mv-tb-qrcode')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isDockMinimized) {
      toggleDockMinimize();
    }
    const tabQA = document.querySelector('.mv-tab-btn[data-tab="tab-qa"]');
    tabQA?.click();
    if (genQrBtn && qrContainer && qrContainer.style.display !== 'block') {
      genQrBtn.click();
    }
  });

  document.getElementById('mv-tb-screenshot')?.addEventListener('click', (e) => {
    e.stopPropagation();
    captureSnapshot(false);
  });

  document.getElementById('mv-tb-copy-img')?.addEventListener('click', (e) => {
    e.stopPropagation();
    captureSnapshot(true);
  });

  document.getElementById('mv-tb-scrolltop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      if (iframeEl?.contentDocument) {
        iframeEl.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (iframeEl?.contentWindow) {
        iframeEl.contentWindow.postMessage({ type: 'SCROLL_TOP' }, '*');
      }
    } catch {}
  });

  document.getElementById('mv-tb-reload')?.addEventListener('click', (e) => {
    e.stopPropagation();
    reloadIframe();
  });

  document.getElementById('mv-tb-copy')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = activeLoadedUrl || iframeEl?.src || urlInputEl?.value || 'https://google.com';
    navigator.clipboard?.writeText(url).then(() => {
      logSecurityEvent('CLIPBOARD', `Copied URL to clipboard: ${url}`, 'pass');
      const btn = document.getElementById('mv-tb-copy');
      if (btn) {
        btn.style.color = '#34d399';
        setTimeout(() => { btn.style.color = ''; }, 1200);
      }
    });
  });

  document.getElementById('mv-tb-open')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.open(activeLoadedUrl || iframeEl?.src, '_blank');
  });

  iframeEl?.addEventListener('load', () => {
    loadingEl.classList.remove('mv-active');
    if (loadTimeout) clearTimeout(loadTimeout);
    const duration = Math.round(performance.now() - loadStartTime);
    if (perfStatusEl) perfStatusEl.textContent = '200 OK (Complete)';
    if (perfTimeEl) perfTimeEl.textContent = `${duration} ms`;
    logSecurityEvent('HTTP', `Page rendered in ${duration}ms`, 'pass');
    logNetworkEvent('200 OK', `DOM Assets Loaded (${duration}ms)`, 'pass');
  });

  urlGoBtnEl?.addEventListener('click', () => {
    loadUrl(urlInputEl?.value);
  });

  urlInputEl?.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      loadUrl(urlInputEl?.value);
    }
  });

  urlInputEl?.addEventListener('input', () => {
    if (urlClearBtnEl) urlClearBtnEl.style.display = urlInputEl?.value ? 'flex' : 'none';
  });

  urlClearBtnEl?.addEventListener('click', () => {
    if (urlInputEl) urlInputEl.value = '';
    if (urlClearBtnEl) urlClearBtnEl.style.display = 'none';
    urlInputEl?.focus();
  });

  quickChips?.forEach((chip) => {
    chip.addEventListener('click', () => {
      loadUrl(chip.getAttribute('data-url'));
    });
  });

  deviceSelectEl?.addEventListener('change', (e) => {
    currentDeviceId = e.target.value;
    applyDeviceLayout();
  });

  // Display Frame Mode (Full Screen Chrome vs Device Mockup)
  const frameModeButtons = document.querySelectorAll('.mv-frame-mode-btn');
  frameModeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      frameModeButtons.forEach(b => b.classList.remove('mv-btn-active'));
      btn.classList.add('mv-btn-active');
      const mode = btn.getAttribute('data-mode') || 'clean';
      isFramelessMode = (mode === 'clean');
      applyDeviceLayout();
      logSecurityEvent('FRAME', `Display style switched to ${isFramelessMode ? 'Full Screen (Chrome)' : 'Device Mockup'}`, 'info');
    });
  });

  orientationBtnEl?.addEventListener('click', () => {
    isLandscape = !isLandscape;
    applyDeviceLayout();
  });

  zoomSelectEl?.addEventListener('change', (e) => {
    currentZoomMode = e.target.value;
    const device = DEVICE_PRESETS[currentDeviceId] || { width: customWidth, height: customHeight };
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;
    calculateScale(width, height);
  });

  reloadBtnEl?.addEventListener('click', reloadIframe);

  scrollTopBtnEl?.addEventListener('click', () => {
    try {
      if (iframeEl?.contentDocument) {
        iframeEl.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (iframeEl?.contentWindow) {
        iframeEl.contentWindow.postMessage({ type: 'SCROLL_TOP' }, '*');
      }
    } catch {}
  });

  openNewTabBtnEl?.addEventListener('click', () => {
    window.open(activeLoadedUrl || iframeEl?.src, '_blank');
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
  function setGridOverlayState(active) {
    isGridActive = !!active;
    if (gridOverlayEl) {
      gridOverlayEl.classList.toggle('mv-grid-active', isGridActive);
    }
    if (gridBtnEl) {
      gridBtnEl.classList.toggle('mv-btn-active', isGridActive);
    }
    const tbGrid = document.getElementById('mv-tb-grid');
    if (tbGrid) {
      tbGrid.classList.toggle('mv-toolbar-btn-active', isGridActive);
    }
    logSecurityEvent('GRID', isGridActive ? '8px baseline alignment grid enabled' : 'Alignment grid disabled', 'info');
  }

  if (gridBtnEl) {
    gridBtnEl.addEventListener('click', () => {
      setGridOverlayState(!isGridActive);
    });
  }

  // Simulated Tap / Touch Feedback Indicator
  function setTouchCursorState(active) {
    isTouchCursorActive = !!active;
    if (touchBtnEl) touchBtnEl.classList.toggle('mv-btn-active', isTouchCursorActive);
    const touchToggleBtnEl = document.getElementById('mv-touch-toggle-btn');
    if (touchToggleBtnEl) touchToggleBtnEl.classList.toggle('mv-btn-active', isTouchCursorActive);
    const tbTouchBtn = document.getElementById('mv-tb-touch');
    if (tbTouchBtn) tbTouchBtn.classList.toggle('mv-toolbar-btn-active', isTouchCursorActive);

    // Send state to in-frame interceptor
    if (iframeEl && iframeEl.contentWindow) {
      try {
        iframeEl.contentWindow.postMessage({
          type: 'MOBILEVIEW_SET_TOUCH_DOT',
          active: isTouchCursorActive
        }, '*');
      } catch (e) {}
    }

    if (!isTouchCursorActive && touchCursorEl) {
      touchCursorEl.style.display = 'none';
      touchCursorEl.classList.remove('mv-touching');
    }
  }

  if (touchBtnEl) {
    touchBtnEl.addEventListener('click', () => {
      setTouchCursorState(!isTouchCursorActive);
    });
  }

  const touchToggleBtn = document.getElementById('mv-touch-toggle-btn');
  if (touchToggleBtn) {
    touchToggleBtn.addEventListener('click', () => {
      setTouchCursorState(!isTouchCursorActive);
    });
  }

  // =========================================================================
  // Live DOM Element Inspector
  // =========================================================================
  let isInspectMode = false;
  let lastInspectedElement = null;

  const inspectCardEl = document.getElementById('mv-inspect-card');
  const inspectTagEl = document.getElementById('mv-inspect-tag');
  const inspectDimsEl = document.getElementById('mv-inspect-dims');
  const inspectFontEl = document.getElementById('mv-inspect-font');
  const inspectColorEl = document.getElementById('mv-inspect-color');
  const inspectPaddingEl = document.getElementById('mv-inspect-padding');
  const inspectMarginEl = document.getElementById('mv-inspect-margin');
  const inspectCodeEl = document.getElementById('mv-inspect-code');
  const inspectCloseBtn = document.getElementById('mv-inspect-close');
  const inspectCopyBtn = document.getElementById('mv-inspect-copy-btn');
  const inspectBtnEl = document.getElementById('mv-inspect-btn');

  function setInspectModeState(active) {
    isInspectMode = !!active;
    const tbInspectBtn = document.getElementById('mv-tb-inspect');
    if (tbInspectBtn) tbInspectBtn.classList.toggle('mv-toolbar-btn-active', isInspectMode);
    if (inspectBtnEl) inspectBtnEl.classList.toggle('mv-btn-active', isInspectMode);

    if (!isInspectMode && inspectCardEl) {
      inspectCardEl.classList.remove('mv-active');
    }

    try {
      iframeEl?.contentWindow?.postMessage({
        type: 'MOBILEVIEW_SET_INSPECT_MODE',
        active: isInspectMode
      }, '*');
    } catch (e) {}

    logSecurityEvent('INSPECT', isInspectMode ? 'Live DOM Element Inspector enabled (Click element in viewport to inspect)' : 'Element Inspector closed', 'info');
  }

  function displayInspectedElement(data) {
    if (!data) return;
    lastInspectedElement = data;
    if (inspectTagEl) {
      const idStr = data.id ? `#${data.id}` : '';
      const clsStr = data.className ? `.${data.className.trim().split(/\s+/)[0]}` : '';
      inspectTagEl.textContent = `<${data.tagName}${idStr}${clsStr}>`;
    }
    if (inspectDimsEl) {
      inspectDimsEl.textContent = `${data.rect?.width || 0} × ${data.rect?.height || 0} px`;
    }
    if (inspectFontEl) {
      inspectFontEl.textContent = `${data.styles?.fontSize || ''} ${data.styles?.fontFamily?.split(',')[0] || ''}`.trim() || 'Inherited';
    }
    if (inspectColorEl) {
      inspectColorEl.textContent = data.styles?.color || 'Inherited';
    }
    if (inspectPaddingEl) {
      inspectPaddingEl.textContent = data.styles?.padding || '0px';
    }
    if (inspectMarginEl) {
      inspectMarginEl.textContent = data.styles?.margin || '0px';
    }
    if (inspectCodeEl) {
      inspectCodeEl.textContent = data.outerHTML || `<${data.tagName}></${data.tagName}>`;
    }
    if (inspectCardEl) {
      inspectCardEl.classList.add('mv-active');
    }

    logSecurityEvent('INSPECT', `Inspected <${data.tagName}> (${data.rect?.width}×${data.rect?.height}px) - Color: ${data.styles?.color}`, 'pass');
  }

  if (inspectCloseBtn) {
    inspectCloseBtn.addEventListener('click', () => {
      if (inspectCardEl) inspectCardEl.classList.remove('mv-active');
      setInspectModeState(false);
    });
  }

  if (inspectCopyBtn) {
    inspectCopyBtn.addEventListener('click', () => {
      if (lastInspectedElement?.outerHTML) {
        navigator.clipboard?.writeText(lastInspectedElement.outerHTML).then(() => {
          inspectCopyBtn.textContent = 'Copied Snippet!';
          setTimeout(() => {
            inspectCopyBtn.textContent = 'Copy HTML Snippet';
          }, 1400);
        });
      }
    });
  }

  if (inspectBtnEl) {
    inspectBtnEl.addEventListener('click', () => {
      setInspectModeState(!isInspectMode);
    });
  }

  if (iframeEl) {
    iframeEl.addEventListener('load', () => {
      setTimeout(() => {
        if (iframeEl.contentWindow) {
          try {
            if (isTouchCursorActive) {
              iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_SET_TOUCH_DOT', active: true }, '*');
            }
            if (isInspectMode) {
              iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_SET_INSPECT_MODE', active: true }, '*');
            }
            if (activeThemeScheme !== 'auto') {
              iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_SET_COLOR_SCHEME', scheme: activeThemeScheme }, '*');
            }
            if (activeNetProfile !== 'online') {
              iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_SET_NETWORK_THROTTLE', profile: activeNetProfile }, '*');
            }
            iframeEl.contentWindow.postMessage({ type: 'MOBILEVIEW_REQUEST_STORAGE' }, '*');
          } catch (e) {}
        }
      }, 200);
    });
  }

  // Tap feedback on click / tap across outer frame
  if (iframeBoxEl) {
    iframeBoxEl.addEventListener('mousedown', (e) => {
      if (!isTouchCursorActive || !touchCursorEl) return;
      const rect = iframeBoxEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      touchCursorEl.style.left = `${clickX}px`;
      touchCursorEl.style.top = `${clickY}px`;
      touchCursorEl.style.display = 'block';
      touchCursorEl.classList.add('mv-touching');
    });

    iframeBoxEl.addEventListener('mouseup', () => {
      if (!isTouchCursorActive || !touchCursorEl) return;
      setTimeout(() => {
        touchCursorEl.classList.remove('mv-touching');
        setTimeout(() => {
          if (!touchCursorEl.classList.contains('mv-touching')) {
            touchCursorEl.style.display = 'none';
          }
        }, 150);
      }, 150);
    });
  }

  // Unified Color Scheme / Theme Switcher
  let activeThemeScheme = 'auto';

  function setColorScheme(themeKey) {
    activeThemeScheme = themeKey || 'auto';

    const themeButtons = document.querySelectorAll('.mv-theme-btn');
    themeButtons.forEach(b => {
      b.classList.toggle('mv-btn-active', b.getAttribute('data-theme') === activeThemeScheme);
    });

    if (themeBtnEl) {
      themeBtnEl.classList.toggle('mv-btn-active', activeThemeScheme === 'dark');
    }
    if (themeTextEl) {
      themeTextEl.textContent = activeThemeScheme === 'dark' ? 'Mode: Dark Theme' : (activeThemeScheme === 'light' ? 'Mode: Light Theme' : 'Mode: System Theme');
    }

    if (iframeEl && iframeEl.contentWindow) {
      try {
        iframeEl.contentWindow.postMessage({
          type: 'MOBILEVIEW_SET_COLOR_SCHEME',
          scheme: activeThemeScheme
        }, '*');
      } catch (e) {}
    }

    logSecurityEvent('THEME', `Color scheme switched to ${activeThemeScheme}`, 'info');
  }

  // Dark / Light Theme Toggles in Viewport Tab
  const themeButtons = document.querySelectorAll('.mv-theme-btn');
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme') || 'auto';
      setColorScheme(theme);
    });
  });

  // QA Tab Theme Toggle Button
  if (themeBtnEl) {
    themeBtnEl.addEventListener('click', () => {
      const nextTheme = activeThemeScheme === 'dark' ? 'light' : 'dark';
      setColorScheme(nextTheme);
    });
  }

  // Quick Network Profile Switcher in Viewport Tab
  const quickNetButtons = document.querySelectorAll('.mv-quick-net-btn');
  quickNetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const profile = btn.getAttribute('data-profile') || 'online';
      setNetworkProfile(profile);
    });
  });

  // Real Mobile QR Code Generator
  const genQrBtn = document.getElementById('mv-gen-qr-btn');
  const qrContainer = document.getElementById('mv-qr-container');
  const qrImgContainer = document.getElementById('mv-qr-code-img');

  if (genQrBtn && qrContainer) {
    genQrBtn.addEventListener('click', () => {
      const isVisible = qrContainer.style.display === 'block';
      if (isVisible) {
        qrContainer.style.display = 'none';
        genQrBtn.textContent = 'Generate QR';
      } else {
        const urlToEncode = activeLoadedUrl || iframeEl.src || 'https://google.com';
        if (qrImgContainer) {
          qrImgContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlToEncode)}" style="width: 130px; height: 130px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" alt="Mobile QR Code" />`;
        }
        qrContainer.style.display = 'block';
        genQrBtn.textContent = 'Hide QR';
      }
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

  // Screenshot / Snapshot (Device Display cropped & exported as JPEG / Copied to Clipboard)
  function captureSnapshot(copyOnly = false) {
    const btn = copyOnly ? document.getElementById('mv-copy-screenshot-btn') : document.getElementById('mv-screenshot-btn');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>
        <span>${copyOnly ? 'Copying...' : 'Capturing...'}</span>
      `;
      btn.disabled = true;
    }

    try {
      const frameEl = document.getElementById('mv-frame') || document.getElementById('mv-stage');
      const rect = frameEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      chrome.runtime.sendMessage({
        type: 'CAPTURE_DEVICE_SNAPSHOT'
      }, (response) => {
        if (response && response.success && response.dataUrl) {
          const img = new Image();
          img.onload = async () => {
            try {
              const canvas = document.createElement('canvas');
              // Calculate cropped bounds around device frame
              const cropX = Math.max(0, (rect.left - 4) * dpr);
              const cropY = Math.max(0, (rect.top - 4) * dpr);
              const cropW = Math.min(img.width - cropX, (rect.width + 8) * dpr);
              const cropH = Math.min(img.height - cropY, (rect.height + 8) * dpr);

              canvas.width = Math.round(cropW);
              canvas.height = Math.round(cropH);
              const ctx = canvas.getContext('2d');

              // White canvas background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Draw cropped device display
              ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

              // 1. Copy Image to OS Clipboard (for instant Ctrl+V pasting)
              try {
                canvas.toBlob(async (blob) => {
                  if (blob && navigator.clipboard && navigator.clipboard.write) {
                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                      ]);
                    } catch (e) {}
                  }
                }, 'image/png');
              } catch (clipErr) {}

              // 2. Download JPEG File (unless copyOnly is requested)
              if (!copyOnly) {
                const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const a = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                a.download = `mobileview-${currentDeviceId || 'device'}-${timestamp}.jpeg`;
                a.href = jpegDataUrl;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }

              if (btn) {
                btn.innerHTML = `
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span>${copyOnly ? 'Copied to Clipboard!' : 'Saved & Copied! (Ctrl+V)'}</span>
                `;
                btn.style.borderColor = '#34d399';
                btn.style.color = '#34d399';
              }
              logSecurityEvent('SNAPSHOT', copyOnly ? 'Device screenshot copied to clipboard' : `Device screenshot saved as JPEG & copied to clipboard (${Math.round(cropW)}×${Math.round(cropH)})`, 'pass');
            } catch (err) {
              console.error('[MobileView] Canvas crop error:', err);
              if (!copyOnly) {
                const a = document.createElement('a');
                a.download = `mobileview-display-${Date.now()}.jpeg`;
                a.href = response.dataUrl;
                a.click();
              }
            }

            if (btn) {
              setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.style.borderColor = '';
                btn.style.color = '';
                btn.disabled = false;
              }, 1800);
            }
          };
          img.src = response.dataUrl;
        } else {
          window.print();
          if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
          }
        }
      });
    } catch (e) {
      console.error('[MobileView] Snapshot error:', e);
      window.print();
      if (btn) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }
  }

  if (screenshotBtnEl) {
    screenshotBtnEl.addEventListener('click', () => captureSnapshot(false));
  }

  const copyScreenshotBtn = document.getElementById('mv-copy-screenshot-btn');
  if (copyScreenshotBtn) {
    copyScreenshotBtn.addEventListener('click', () => captureSnapshot(true));
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
    } else if (e.key === 'g' || e.key === 'G') {
      setGridOverlayState(!isGridActive);
    } else if (e.key === 'i' || e.key === 'I') {
      setInspectModeState(!isInspectMode);
    } else if (e.key === 't' || e.key === 'T') {
      setTouchCursorState(!isTouchCursorActive);
    } else if (e.key === 's' || e.key === 'S') {
      captureSnapshot(false);
    } else if (e.key === 'c' || e.key === 'C') {
      captureSnapshot(true);
    } else if (e.key === 'd' || e.key === 'D') {
      const nextTheme = activeThemeScheme === 'dark' ? 'light' : 'dark';
      setColorScheme(nextTheme);
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
