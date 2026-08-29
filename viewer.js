/**
 * MobileView — Standalone Pop-out Window Controller
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

  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialUrl = urlParams.get('url') || 'https://www.google.com';
  const initialDevice = urlParams.get('device') || 'iphone-16-pro';
  const initialLandscape = urlParams.get('landscape') === 'true';

  // State Management
  let currentDeviceId = DEVICE_PRESETS[initialDevice] ? initialDevice : 'iphone-16-pro';
  let isLandscape = initialLandscape;
  let currentZoomMode = 'auto';
  let activeLoadedUrl = initialUrl;
  let loadTimeout = null;

  // DOM Elements
  const frameEl = document.getElementById('mv-frame');
  const stageEl = document.getElementById('mv-stage');
  const cameraContainerEl = document.getElementById('mv-camera-container');
  const iframeEl = document.getElementById('mv-iframe');
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

  // Calculate Layout & Scaling
  function applyDeviceLayout() {
    const device = DEVICE_PRESETS[currentDeviceId] || DEVICE_PRESETS['iphone-16-pro'];
    const width = isLandscape ? device.height : device.width;
    const height = isLandscape ? device.width : device.height;

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

    // Sync device OS User-Agent
    try {
      chrome.runtime.sendMessage({ type: 'SET_DEVICE_OS', os: device.os });
    } catch (e) {}

    calculateScale(width, height);
  }

  function calculateScale(deviceWidth, deviceHeight) {
    const availWidth = window.innerWidth - 380;
    const availHeight = window.innerHeight - 50;

    let scale = 1;
    if (currentZoomMode === 'auto') {
      const scaleX = availWidth / (deviceWidth + 24);
      const scaleY = availHeight / (deviceHeight + 24);
      scale = Math.min(1, scaleX, scaleY);
      scale = Math.max(0.35, scale);
    } else {
      scale = parseInt(currentZoomMode, 10) / 100;
    }

    stageEl.style.transform = `scale(${scale.toFixed(3)})`;
  }

  // Load URL
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

  function reloadIframe() {
    loadingEl.classList.add('mv-active');
    const currentSrc = activeLoadedUrl || iframeEl.src || 'https://www.google.com';
    iframeEl.src = 'about:blank';
    requestAnimationFrame(() => {
      iframeEl.src = currentSrc;
    });
  }

  // Event Listeners
  iframeEl.addEventListener('load', () => {
    loadingEl.classList.remove('mv-active');
    if (loadTimeout) clearTimeout(loadTimeout);
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
    const device = DEVICE_PRESETS[currentDeviceId];
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

  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

    if (e.key === 'o' || e.key === 'O') {
      isLandscape = !isLandscape;
      applyDeviceLayout();
    } else if (e.key === 'r' || e.key === 'R') {
      reloadIframe();
    }
  });

  window.addEventListener('resize', () => {
    const device = DEVICE_PRESETS[currentDeviceId];
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
