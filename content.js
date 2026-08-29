/**
 * Content Script for Responsive Mobile Viewport & Mockup Tester
 * Injects an isolated Shadow DOM overlay with a realistic device mockup,
 * interactive URL navigation, and responsive controls.
 */

(() => {
  // Prevent duplicate execution/initialization
  if (window.__MV_RESPONSIVE_TESTER_INITIALIZED__) {
    if (window.__MV_TOGGLE_OVERLAY__) {
      window.__MV_TOGGLE_OVERLAY__();
    }
    return;
  }
  window.__MV_RESPONSIVE_TESTER_INITIALIZED__ = true;

  // Device Presets Catalog
  const DEVICE_PRESETS = {
    'iphone-16-pro': {
      name: 'iPhone 16 / 15 / 14 Pro',
      width: 393,
      height: 852,
      radius: 48,
      camera: 'island',
      os: 'iOS',
      category: 'Apple iPhones'
    },
    'iphone-15-max': {
      name: 'iPhone 15 / 14 Pro Max',
      width: 430,
      height: 932,
      radius: 52,
      camera: 'island',
      os: 'iOS',
      category: 'Apple iPhones'
    },
    'iphone-14': {
      name: 'iPhone 14 / 13 / 12',
      width: 390,
      height: 844,
      radius: 46,
      camera: 'notch',
      os: 'iOS',
      category: 'Apple iPhones'
    },
    'iphone-se': {
      name: 'iPhone SE (3rd Gen)',
      width: 375,
      height: 667,
      radius: 26,
      camera: 'tablet',
      os: 'iOS',
      category: 'Apple iPhones'
    },
    'galaxy-s24': {
      name: 'Samsung Galaxy S24 / S23',
      width: 360,
      height: 780,
      radius: 36,
      camera: 'punch-hole',
      os: 'Android',
      category: 'Android Flagships'
    },
    'galaxy-s24-ultra': {
      name: 'Samsung Galaxy S24 Ultra',
      width: 412,
      height: 915,
      radius: 22,
      camera: 'punch-hole',
      os: 'Android',
      category: 'Android Flagships'
    },
    'pixel-8-pro': {
      name: 'Google Pixel 8 Pro / 7',
      width: 412,
      height: 915,
      radius: 40,
      camera: 'punch-hole',
      os: 'Android',
      category: 'Android Flagships'
    },
    'ipad-mini': {
      name: 'iPad Mini (6th Gen)',
      width: 744,
      height: 1133,
      radius: 30,
      camera: 'tablet',
      os: 'iPadOS',
      category: 'Tablets'
    },
    'ipad-air': {
      name: 'iPad Air / Pro 11"',
      width: 820,
      height: 1180,
      radius: 34,
      camera: 'tablet',
      os: 'iPadOS',
      category: 'Tablets'
    }
  };

  // State Management
  let currentDeviceId = 'iphone-16-pro';
  let isLandscape = false;
  let currentZoomMode = 'auto'; // 'auto', '100', '85', '75', '60'
  let isOpen = false;
  let isDockMinimized = false;
  let clockInterval = null;
  let activeLoadedUrl = window.location.href;
  let loadTimeout = null;

  // Helper: Normalize URL string for mobile devices
  function normalizeUrl(input) {
    let url = (input || '').trim();
    if (!url) return '';

    // Smart canonical normalization for popular websites
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

  // Create Host Element & Shadow Root for 100% CSS encapsulation
  const hostElement = document.createElement('div');
  hostElement.id = 'mv-responsive-tester-host';
  document.documentElement.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // Inject Stylesheet link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('styles.css');
  shadowRoot.appendChild(link);

  // SVG Icons
  const SVG_ICONS = {
    phone: `<svg viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`,
    rotate: `<svg viewBox="0 0 24 24"><path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.5-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.88-1.6-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c3.37 0 6.09 2.72 6.09 6.09s-2.72 6.09-6.09 6.09v2.02c4.49 0 8.11-3.62 8.11-8.11S17.49 4.07 13 4.07z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
    scrollTop: `<svg viewBox="0 0 24 24"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>`,
    arrowDown: `<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>`,
    lock: `<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
    globe: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
    signal: `<svg viewBox="0 0 24 24"><path d="M2 22h20V2z"/></svg>`,
    wifi: `<svg viewBox="0 0 24 24"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z"/></svg>`,
    battery: `<svg viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>`,
    enter: `<svg viewBox="0 0 24 24"><path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z"/></svg>`,
    clear: `<svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    popout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    minimize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
  };

  // Build Overlay DOM Structure
  const backdrop = document.createElement('div');
  backdrop.id = 'mv-backdrop';

  backdrop.innerHTML = `
    <div class="mv-workspace">
      <!-- Scalable Stage Container -->
      <div class="mv-stage-container" id="mv-stage">
        <div class="mv-device-wrapper">
          <!-- Physical Hardware Buttons -->
          <div class="mv-side-buttons">
            <div class="mv-btn-action"></div>
            <div class="mv-btn-vol-up"></div>
            <div class="mv-btn-vol-down"></div>
            <div class="mv-btn-power"></div>
          </div>

          <!-- Device Outer Frame -->
          <div class="mv-device-frame" id="mv-frame">
            <!-- Screen Housing -->
            <div class="mv-screen-housing">
              <!-- Realistic Status Bar with Nested Camera Element -->
              <div class="mv-status-bar" id="mv-status-bar">
                <div class="mv-status-left">
                  <span id="mv-clock">9:41</span>
                </div>
                <!-- Top Camera Element (Dynamic Island, Notch, etc.) -->
                <div id="mv-camera-container"></div>
                <div class="mv-status-right">
                  <span class="mv-status-icon">${SVG_ICONS.signal}</span>
                  <span class="mv-status-icon">${SVG_ICONS.wifi}</span>
                  <span class="mv-status-icon">${SVG_ICONS.battery}</span>
                </div>
              </div>

              <!-- Iframe Viewport Container -->
              <div class="mv-iframe-container">
                <iframe 
                  class="mv-device-iframe" 
                  id="mv-iframe" 
                  src="about:blank"
                  referrerpolicy="no-referrer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
                <div class="mv-loading-overlay" id="mv-loading">
                  <div class="mv-spinner"></div>
                  <span class="mv-loading-text">Loading mobile viewport...</span>
                </div>
              </div>

              <!-- Bottom Gesture / Home Indicator -->
              <div class="mv-home-indicator" id="mv-home-bar"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Controls Dock (Collapsible into Bubble) -->
      <div class="mv-controls-dock" id="mv-dock">
        <!-- Floating Bubble View (Shown when Minimized) -->
        <div class="mv-bubble-view" id="mv-bubble-view" title="Expand MobileView Controls (M)">
          ${SVG_ICONS.phone}
        </div>

        <!-- Full Dock Contents -->
        <div class="mv-dock-inner">
          <!-- Dock Header -->
          <div class="mv-dock-header">
            <div class="mv-dock-title-group">
              <div class="mv-dock-badge-icon">${SVG_ICONS.phone}</div>
              <div>
                <div class="mv-dock-title">MobileView</div>
                <div class="mv-dock-subtitle">Responsive UI Tester</div>
              </div>
            </div>
            <div class="mv-dock-actions">
              <button class="mv-minimize-btn" id="mv-minimize-btn" title="Minimize to Floating Bubble (M)">
                ${SVG_ICONS.minimize}
              </button>
              <button class="mv-close-btn" id="mv-close-btn" title="Close Preview (Esc)">
                ${SVG_ICONS.close}
              </button>
            </div>
          </div>

          <!-- Editable URL Address Bar -->
          <div class="mv-control-group">
            <label class="mv-control-label">Target URL</label>
            <div class="mv-url-form">
              <div class="mv-url-input-container">
                <span class="mv-url-icon">${SVG_ICONS.globe}</span>
                <input 
                  type="text" 
                  class="mv-url-input" 
                  id="mv-url-input" 
                  placeholder="Enter URL (e.g. google.com, facebook.com, localhost:3000)..."
                  spellcheck="false"
                  autocomplete="off"
                />
                <button class="mv-url-clear-btn" id="mv-url-clear-btn" title="Clear URL">
                  ${SVG_ICONS.clear}
                </button>
              </div>
              <button class="mv-url-go-btn" id="mv-url-go-btn" title="Load URL (Enter)">
                ${SVG_ICONS.enter}
              </button>
            </div>
            <!-- Quick Preset Chips -->
            <div class="mv-quick-links">
              <button class="mv-chip" data-url="current">Current Tab</button>
              <button class="mv-chip" data-url="https://www.google.com">Google</button>
              <button class="mv-chip" data-url="https://m.facebook.com">Facebook</button>
              <button class="mv-chip" data-url="https://github.com">GitHub</button>
              <button class="mv-chip" data-url="http://localhost:3000">Localhost:3000</button>
            </div>
          </div>

          <!-- Device Selector -->
          <div class="mv-control-group">
            <label class="mv-control-label">Device Preset</label>
            <div class="mv-select-wrapper">
              <select class="mv-device-select" id="mv-device-select"></select>
              <span class="mv-select-arrow">${SVG_ICONS.arrowDown}</span>
            </div>
            <div class="mv-dimension-badge" id="mv-dimension-badge">393 × 852 px</div>
          </div>

          <!-- Orientation & Zoom Controls -->
          <div class="mv-control-group">
            <label class="mv-control-label">Orientation & Scale</label>
            <div class="mv-btn-grid">
              <button class="mv-btn" id="mv-orientation-btn" title="Toggle Portrait / Landscape (O)">
                ${SVG_ICONS.rotate}
                <span id="mv-orientation-text">Portrait</span>
              </button>
              <div class="mv-select-wrapper">
                <select class="mv-device-select" id="mv-zoom-select" style="padding-top: 8px; padding-bottom: 8px;">
                  <option value="auto">Auto-Fit</option>
                  <option value="100">100%</option>
                  <option value="85">85%</option>
                  <option value="75">75%</option>
                  <option value="60">60%</option>
                </select>
                <span class="mv-select-arrow">${SVG_ICONS.arrowDown}</span>
              </div>
            </div>
          </div>

          <!-- Quick Action Toolbar -->
          <div class="mv-action-toolbar">
            <button class="mv-icon-btn" id="mv-popout-btn" title="Pop-out to Standalone Window (P)">
              ${SVG_ICONS.popout}
            </button>
            <button class="mv-icon-btn" id="mv-reload-btn" title="Reload iframe (R)">
              ${SVG_ICONS.refresh}
            </button>
            <button class="mv-icon-btn" id="mv-scroll-top-btn" title="Scroll to top">
              ${SVG_ICONS.scrollTop}
            </button>
            <button class="mv-icon-btn" id="mv-open-new-tab-btn" title="Open loaded URL in new tab">
              ${SVG_ICONS.external}
            </button>
          </div>

          <!-- Keyboard Hint -->
          <div class="mv-keyboard-hint">
            <span>Press</span>
            <span class="mv-kbd">Esc</span>
            <span>close</span>
            <span>•</span>
            <span class="mv-kbd">M</span>
            <span>bubble</span>
            <span>•</span>
            <span class="mv-kbd">P</span>
            <span>pop-out</span>
            <span>•</span>
            <span class="mv-kbd">O</span>
            <span>rotate</span>
            <span>•</span>
            <span class="mv-kbd">↵</span>
            <span>load</span>
          </div>
        </div>
      </div>
    </div>
  `;

  shadowRoot.appendChild(backdrop);

  // Cached DOM Elements inside Shadow Root
  const frameEl = shadowRoot.getElementById('mv-frame');
  const stageEl = shadowRoot.getElementById('mv-stage');
  const cameraContainerEl = shadowRoot.getElementById('mv-camera-container');
  const iframeEl = shadowRoot.getElementById('mv-iframe');
  const loadingEl = shadowRoot.getElementById('mv-loading');
  const deviceSelectEl = shadowRoot.getElementById('mv-device-select');
  const zoomSelectEl = shadowRoot.getElementById('mv-zoom-select');
  const dimensionBadgeEl = shadowRoot.getElementById('mv-dimension-badge');
  const orientationBtnEl = shadowRoot.getElementById('mv-orientation-btn');
  const orientationTextEl = shadowRoot.getElementById('mv-orientation-text');
  const closeBtnEl = shadowRoot.getElementById('mv-close-btn');
  const minimizeBtnEl = shadowRoot.getElementById('mv-minimize-btn');
  const popoutBtnEl = shadowRoot.getElementById('mv-popout-btn');
  const reloadBtnEl = shadowRoot.getElementById('mv-reload-btn');
  const scrollTopBtnEl = shadowRoot.getElementById('mv-scroll-top-btn');
  const openNewTabBtnEl = shadowRoot.getElementById('mv-open-new-tab-btn');
  const urlInputEl = shadowRoot.getElementById('mv-url-input');
  const urlClearBtnEl = shadowRoot.getElementById('mv-url-clear-btn');
  const urlGoBtnEl = shadowRoot.getElementById('mv-url-go-btn');
  const quickChips = shadowRoot.querySelectorAll('.mv-chip');
  const clockEl = shadowRoot.getElementById('mv-clock');
  const dockEl = shadowRoot.getElementById('mv-dock');

  // Populate Device Selector Options grouped by category
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

  // Render Camera Element based on device style
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

  // Update Status Bar Clock with real local time
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    clockEl.textContent = `${hours}:${formattedMinutes}`;
  }

  // Calculate & Apply Frame Geometry and Auto-Scaling
  function applyDeviceLayout() {
    const device = DEVICE_PRESETS[currentDeviceId] || DEVICE_PRESETS['iphone-16-pro'];
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;

    // Apply dimensions to frame
    frameEl.style.width = `${width}px`;
    frameEl.style.height = `${height}px`;
    frameEl.style.borderRadius = `${device.radius}px`;

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
    renderCameraElement(device.camera);

    // Sync device OS User-Agent to background service worker
    try {
      chrome.runtime.sendMessage({ type: 'SET_DEVICE_OS', os: device.os });
    } catch (e) {
      // ignore
    }

    // Calculate scaling transform
    calculateScale(width, height);
  }

  function calculateScale(deviceWidth, deviceHeight) {
    const availWidth = window.innerWidth - (isDockMinimized ? 90 : 410); // Reserve room for dock and padding
    const availHeight = window.innerHeight - 80;

    let scale = 1;
    if (currentZoomMode === 'auto') {
      const scaleX = availWidth / (deviceWidth + 24);
      const scaleY = availHeight / (deviceHeight + 24);
      scale = Math.min(1.0, scaleX, scaleY);
      scale = Math.max(0.25, scale);
    } else {
      scale = parseInt(currentZoomMode, 10) / 100;
    }

    stageEl.style.transform = `scale(${scale.toFixed(3)})`;
  }

  // Navigate to Target URL
  function loadUrl(targetUrl) {
    const cleanUrl = normalizeUrl(targetUrl);
    if (!cleanUrl) return;

    activeLoadedUrl = cleanUrl;
    urlInputEl.value = cleanUrl;
    urlClearBtnEl.style.display = 'flex';

    loadingEl.classList.add('mv-active');

    if (loadTimeout) clearTimeout(loadTimeout);
    loadTimeout = setTimeout(() => {
      loadingEl.classList.remove('mv-active');
    }, 3500);

    iframeEl.src = cleanUrl;
  }

  // Safe reload without cross-origin DOM exceptions
  function reloadIframe() {
    loadingEl.classList.add('mv-active');
    const currentSrc = activeLoadedUrl || iframeEl.src || window.location.href;
    iframeEl.src = 'about:blank';
    requestAnimationFrame(() => {
      iframeEl.src = currentSrc;
    });
  }

  // Toggle Overlay Visibility
  function toggleOverlay() {
    if (isOpen) {
      closeOverlay();
    } else {
      openOverlay();
    }
  }
  window.__MV_TOGGLE_OVERLAY__ = toggleOverlay;

  function openOverlay() {
    isOpen = true;
    const initialUrl = activeLoadedUrl || window.location.href;
    urlInputEl.value = initialUrl;
    urlClearBtnEl.style.display = initialUrl ? 'flex' : 'none';

    // Load initial URL
    loadUrl(initialUrl);

    backdrop.classList.add('mv-visible');
    applyDeviceLayout();
    updateClock();

    if (!clockInterval) {
      clockInterval = setInterval(updateClock, 10000);
    }
  }

  function closeOverlay() {
    isOpen = false;
    backdrop.classList.remove('mv-visible');
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
  }

  // Event Listeners
  iframeEl.addEventListener('load', () => {
    loadingEl.classList.remove('mv-active');
    if (loadTimeout) clearTimeout(loadTimeout);
  });

  // URL Input navigation handlers
  urlGoBtnEl.addEventListener('click', () => {
    loadUrl(urlInputEl.value);
  });

  urlInputEl.addEventListener('keydown', (e) => {
    e.stopPropagation(); // Prevent hotkeys while typing
    if (e.key === 'Enter') {
      e.preventDefault();
      loadUrl(urlInputEl.value);
    } else if (e.key === 'Escape') {
      urlInputEl.blur();
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

  // Quick preset chips
  quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const urlAttr = chip.getAttribute('data-url');
      const targetUrl = urlAttr === 'current' ? window.location.href : urlAttr;
      loadUrl(targetUrl);
    });
  });

  // Device dropdown change
  deviceSelectEl.addEventListener('change', (e) => {
    currentDeviceId = e.target.value;
    applyDeviceLayout();
  });

  // Orientation toggle button
  orientationBtnEl.addEventListener('click', () => {
    isLandscape = !isLandscape;
    applyDeviceLayout();
  });

  // Zoom / Scale selector
  zoomSelectEl.addEventListener('change', (e) => {
    currentZoomMode = e.target.value;
    const device = DEVICE_PRESETS[currentDeviceId];
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;
    calculateScale(width, height);
  });

  // Toggle Dock Minimize to Fixed Corner Bubble
  function toggleDockMinimize() {
    isDockMinimized = !isDockMinimized;
    if (isDockMinimized) {
      dockEl.classList.add('mv-minimized');
    } else {
      dockEl.classList.remove('mv-minimized');
    }
    const device = DEVICE_PRESETS[currentDeviceId];
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;
    calculateScale(width, height);
  }

  // Minimize button click inside header
  minimizeBtnEl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDockMinimize();
  });

  // Clicking the fixed bubble expands the dock
  dockEl.addEventListener('click', () => {
    if (isDockMinimized) {
      toggleDockMinimize();
    }
  });

  // Close button
  closeBtnEl.addEventListener('click', closeOverlay);

  // Pop-out to standalone window
  function triggerPopout() {
    const currentUrl = activeLoadedUrl || iframeEl.src || window.location.href;
    chrome.runtime.sendMessage({
      type: 'OPEN_POPOUT_WINDOW',
      url: currentUrl,
      device: currentDeviceId,
      isLandscape: isLandscape
    });
    closeOverlay();
  }
  popoutBtnEl.addEventListener('click', triggerPopout);

  // Reload iframe cleanly without touching cross-origin window
  reloadBtnEl.addEventListener('click', reloadIframe);

  // Safe scroll to top without cross-origin exceptions
  scrollTopBtnEl.addEventListener('click', () => {
    try {
      if (iframeEl.contentDocument) {
        iframeEl.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        iframeEl.contentWindow.postMessage({ type: 'SCROLL_TOP' }, '*');
      }
    } catch {
      // Silently catch cross-origin boundary restrictions
    }
  });

  // Open active page in new tab
  openNewTabBtnEl.addEventListener('click', () => {
    window.open(activeLoadedUrl || window.location.href, '_blank');
  });

  // Backdrop click to dismiss
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop || e.target.classList.contains('mv-workspace')) {
      closeOverlay();
    }
  });

  // Prevent clicks inside phone frame from bubbling
  frameEl.addEventListener('click', (e) => e.stopPropagation());

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;

    const activeEl = shadowRoot.activeElement || document.activeElement;
    if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleDockMinimize();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      triggerPopout();
    } else if (e.key === 'o' || e.key === 'O') {
      isLandscape = !isLandscape;
      applyDeviceLayout();
    } else if (e.key === 'r' || e.key === 'R') {
      reloadIframe();
    }
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    if (isOpen) {
      const device = DEVICE_PRESETS[currentDeviceId];
      const width = isLandscape ? device.height : device.width;
      const height = isLandscape ? device.width : device.height;
      calculateScale(width, height);
    }
  });

  // Extension Runtime Message Listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'MV_TOGGLE_OVERLAY') {
      toggleOverlay();
      sendResponse({ success: true, isOpen });
    }
    return true;
  });

  // Automatically open upon initial injection
  openOverlay();
})();
