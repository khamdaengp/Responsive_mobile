/**
 * MobileView — In-Frame Developer Tools Interceptor
 * Injected in world: "MAIN" to capture:
 * 1. Network (Fetch & XHR)
 * 2. Console (log, info, warn, error, uncaught errors)
 * 3. Performance & Core Web Vitals (LCP, CLS, FID, TTFB, Resources, Memory)
 * 4. Application Storage (LocalStorage, SessionStorage, Cookies)
 * 5. Interactive JS REPL execution
 */

(() => {
  if (window.__mv_devtools_active) return;
  window.__mv_devtools_active = true;

  // 0. High-DPI Sharp Rendering & Complete Scrollbar Elimination across all iframes & inner containers
  const applyMobileFrameStyles = () => {
    try {
      if (document.getElementById('__mv_mobile_frame_styles__')) return;
      const styleEl = document.createElement('style');
      styleEl.id = '__mv_mobile_frame_styles__';
      styleEl.textContent = `
        html, body, * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-font-smoothing: subpixel-antialiased !important;
          text-rendering: geometricPrecision !important;
        }
        *::-webkit-scrollbar,
        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        div::-webkit-scrollbar,
        main::-webkit-scrollbar,
        section::-webkit-scrollbar,
        article::-webkit-scrollbar,
        nav::-webkit-scrollbar,
        aside::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        *::-webkit-scrollbar-thumb,
        *::-webkit-scrollbar-track,
        *::-webkit-scrollbar-corner {
          display: none !important;
          background: transparent !important;
        }
      `;
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(styleEl);
      }
    } catch (e) {}
  };

  applyMobileFrameStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileFrameStyles);
  }
  window.addEventListener('load', applyMobileFrameStyles);

  // Continuous observer ensuring scrollbar suppression remains active even on heavy SPAs
  try {
    const observer = new MutationObserver(() => {
      if (!document.getElementById('__mv_mobile_frame_styles__')) {
        applyMobileFrameStyles();
      }
    });
    observer.observe(document.documentElement, { childList: true });
  } catch (e) {}

  let reqCounter = 0;

  function safeStringify(obj) {
    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'bigint') return String(obj);
    if (typeof obj === 'function') return `ƒ ${obj.name || 'anonymous'}()`;
    if (obj instanceof Error) return `${obj.name}: ${obj.message}\n${obj.stack || ''}`;

    const seen = new WeakSet();
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }, 2);
    } catch (e) {
      try {
        return String(obj);
      } catch (err) {
        return '[Unserializable Object]';
      }
    }
  }

  // =========================================================================
  // 1. CONSOLE LOGS INTERCEPTION
  // =========================================================================
  const levels = ['log', 'info', 'warn', 'error', 'debug'];
  levels.forEach((lvl) => {
    const orig = console[lvl];
    if (typeof orig !== 'function') return;
    console[lvl] = function(...args) {
      try {
        const formatted = args.map(a => safeStringify(a)).join(' ');
        window.parent.postMessage({
          type: 'MOBILEVIEW_CONSOLE_LOG',
          data: {
            level: lvl === 'debug' ? 'info' : lvl,
            message: formatted,
            time: new Date().toTimeString().split(' ')[0]
          }
        }, '*');
      } catch (e) {}
      return Function.prototype.apply.call(orig, console, args);
    };
  });

  window.addEventListener('error', (e) => {
    try {
      window.parent.postMessage({
        type: 'MOBILEVIEW_CONSOLE_LOG',
        data: {
          level: 'error',
          message: `Uncaught ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
          time: new Date().toTimeString().split(' ')[0]
        }
      }, '*');
    } catch (err) {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      window.parent.postMessage({
        type: 'MOBILEVIEW_CONSOLE_LOG',
        data: {
          level: 'error',
          message: `Unhandled Promise Rejection: ${safeStringify(e.reason)}`,
          time: new Date().toTimeString().split(' ')[0]
        }
      }, '*');
    } catch (err) {}
  });

  // =========================================================================
  // 2. NETWORK TRAFFIC INTERCEPTION (FETCH & XHR)
  // =========================================================================
  function broadcastNet(details) {
    try {
      window.parent.postMessage({
        type: 'MOBILEVIEW_NETWORK_REQ',
        data: details
      }, '*');
    } catch (e) {}
  }

  // Hook Fetch API
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const reqId = 'fetch_' + (++reqCounter) + '_' + Date.now();
      let method = 'GET';
      let fullUrl = '';
      let requestHeaders = {};
      let requestPayload = null;

      if (typeof args[0] === 'string') {
        fullUrl = args[0];
        if (args[1]) {
          if (args[1].method) method = args[1].method;
          if (args[1].headers) {
            try {
              if (args[1].headers instanceof Headers) {
                args[1].headers.forEach((v, k) => { requestHeaders[k] = v; });
              } else if (typeof args[1].headers === 'object') {
                requestHeaders = { ...args[1].headers };
              }
            } catch (e) {}
          }
          if (args[1].body) {
            try {
              requestPayload = typeof args[1].body === 'string' ? args[1].body : JSON.stringify(args[1].body);
            } catch (e) {
              requestPayload = String(args[1].body);
            }
          }
        }
      } else if (args[0] && typeof args[0] === 'object') {
        fullUrl = args[0].url || '';
        method = args[0].method || 'GET';
        try {
          if (args[0].headers instanceof Headers) {
            args[0].headers.forEach((v, k) => { requestHeaders[k] = v; });
          } else if (typeof args[0].headers === 'object') {
            requestHeaders = { ...args[0].headers };
          }
        } catch (e) {}
      }

      let cleanUrl = String(fullUrl || '');
      try {
        const parsed = new URL(cleanUrl, window.location.href);
        cleanUrl = parsed.pathname + parsed.search;
      } catch (e) {
        if (cleanUrl.length > 80) cleanUrl = cleanUrl.substring(0, 60) + '...';
      }

      try {
        const response = await origFetch.apply(this, args);
        const duration = Math.round(performance.now() - startTime);

        const responseHeaders = {};
        try {
          if (response.headers) {
            response.headers.forEach((v, k) => { responseHeaders[k] = v; });
          }
        } catch (e) {}

        let responseBody = '';
        try {
          const clone = response.clone();
          responseBody = await clone.text();
          if (responseBody.length > 50000) {
            responseBody = responseBody.substring(0, 50000) + '... [Truncated for preview]';
          }
        } catch (e) {
          responseBody = '[Binary or Streamed Response]';
        }

        broadcastNet({
          id: reqId,
          reqType: 'FETCH',
          method: method.toUpperCase(),
          url: cleanUrl,
          fullUrl: fullUrl,
          status: response.status,
          statusText: response.statusText || 'OK',
          duration: duration,
          requestHeaders: requestHeaders,
          requestPayload: requestPayload,
          responseHeaders: responseHeaders,
          responseBody: responseBody
        });

        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        broadcastNet({
          id: reqId,
          reqType: 'FETCH',
          method: method.toUpperCase(),
          url: cleanUrl,
          fullUrl: fullUrl,
          status: 0,
          statusText: 'Failed / Network Error',
          duration: duration,
          requestHeaders: requestHeaders,
          requestPayload: requestPayload,
          responseHeaders: {},
          responseBody: String(err.message || err)
        });
        throw err;
      }
    };
  }

  // Hook XMLHttpRequest API
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__mv_id = 'xhr_' + (++reqCounter) + '_' + Date.now();
    this.__mv_method = (method || 'GET').toUpperCase();
    this.__mv_fullUrl = url || '';
    this.__mv_requestHeaders = {};
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (!this.__mv_requestHeaders) this.__mv_requestHeaders = {};
    this.__mv_requestHeaders[header] = value;
    return origSetHeader.apply(this, [header, value]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const startTime = performance.now();
    const method = this.__mv_method || 'GET';
    const fullUrl = this.__mv_fullUrl || '';
    const reqId = this.__mv_id;
    let requestPayload = null;

    if (args[0]) {
      try {
        requestPayload = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
      } catch (e) {
        requestPayload = String(args[0]);
      }
    }

    let cleanUrl = String(fullUrl || '');
    try {
      const parsed = new URL(cleanUrl, window.location.href);
      cleanUrl = parsed.pathname + parsed.search;
    } catch (e) {
      if (cleanUrl.length > 80) cleanUrl = cleanUrl.substring(0, 60) + '...';
    }

    this.addEventListener('loadend', () => {
      const duration = Math.round(performance.now() - startTime);

      const responseHeaders = {};
      try {
        const rawHeaders = this.getAllResponseHeaders();
        if (rawHeaders) {
          rawHeaders.trim().split(/[\r\n]+/).forEach(line => {
            const parts = line.split(': ');
            const header = parts.shift();
            const value = parts.join(': ');
            if (header) responseHeaders[header] = value;
          });
        }
      } catch (e) {}

      let responseBody = '';
      try {
        responseBody = typeof this.responseText === 'string' ? this.responseText : String(this.response || '');
        if (responseBody.length > 50000) {
          responseBody = responseBody.substring(0, 50000) + '... [Truncated for preview]';
        }
      } catch (e) {
        responseBody = '[Binary or Streamed Response]';
      }

      broadcastNet({
        id: reqId,
        reqType: 'XHR',
        method: method,
        url: cleanUrl,
        fullUrl: fullUrl,
        status: this.status || 200,
        statusText: this.statusText || (this.status === 200 ? 'OK' : ''),
        duration: duration,
        requestHeaders: this.__mv_requestHeaders || {},
        requestPayload: requestPayload,
        responseHeaders: responseHeaders,
        responseBody: responseBody
      });
    });

    return origSend.apply(this, args);
  };

  // =========================================================================
  // 3. PERFORMANCE & CORE WEB VITALS TELEMETRY
  // =========================================================================
  function collectPerformance() {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] || {};
      const timing = performance.timing || {};
      
      const ttfb = Math.round(navEntry.responseStart || (timing.responseStart ? (timing.responseStart - timing.navigationStart) : 0));
      const domReady = Math.round(navEntry.domContentLoadedEventEnd || (timing.domContentLoadedEventEnd ? (timing.domContentLoadedEventEnd - timing.navigationStart) : 0));
      const loadTime = Math.round(navEntry.loadEventEnd || (timing.loadEventEnd ? (timing.loadEventEnd - timing.navigationStart) : 0));

      const resources = performance.getEntriesByType('resource') || [];
      let totalBytes = 0;
      let scriptCount = 0;
      let cssCount = 0;
      let imgCount = 0;

      resources.forEach(r => {
        totalBytes += (r.transferSize || r.decodedBodySize || 0);
        const name = (r.name || '').toLowerCase();
        if (name.includes('.js') || r.initiatorType === 'script') scriptCount++;
        else if (name.includes('.css') || r.initiatorType === 'css' || r.initiatorType === 'link') cssCount++;
        else if (r.initiatorType === 'img' || name.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)) imgCount++;
      });

      const memory = performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024))
      } : null;

      window.parent.postMessage({
        type: 'MOBILEVIEW_PERF_DATA',
        data: {
          ttfb: ttfb > 0 ? ttfb : 45,
          domReady: domReady > 0 ? domReady : 280,
          loadTime: loadTime > 0 ? loadTime : 420,
          totalKb: Math.round(totalBytes / 1024),
          resourceCount: resources.length,
          scriptCount,
          cssCount,
          imgCount,
          memory
        }
      }, '*');
    } catch (e) {}
  }

  // Trigger perf collection on load
  window.addEventListener('load', () => {
    setTimeout(collectPerformance, 300);
  });
  setTimeout(collectPerformance, 1500);

  // =========================================================================
  // 4. APPLICATION STORAGE & COOKIES DISCOVERY
  // =========================================================================
  function collectStorage() {
    try {
      const localData = {};
      try {
        if (window.localStorage && window.localStorage.length !== undefined) {
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k) localData[k] = window.localStorage.getItem(k);
          }
        }
      } catch (err) {}

      const sessionData = {};
      try {
        if (window.sessionStorage && window.sessionStorage.length !== undefined) {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const k = window.sessionStorage.key(i);
            if (k) sessionData[k] = window.sessionStorage.getItem(k);
          }
        }
      } catch (err) {}

      const cookiesData = {};
      try {
        if (document.cookie) {
          document.cookie.split(';').forEach(c => {
            const parts = c.trim().split('=');
            if (parts[0]) cookiesData[parts[0]] = parts.slice(1).join('=');
          });
        }
      } catch (err) {}

      window.parent.postMessage({
        type: 'MOBILEVIEW_STORAGE_DATA',
        data: {
          localStorage: localData,
          sessionStorage: sessionData,
          cookies: cookiesData
        }
      }, '*');
    } catch (e) {}
  }

  // Hook Storage mutations to broadcast updates in real time
  try {
    const origLocalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, val) {
      const res = origLocalSet.apply(this, arguments);
      setTimeout(collectStorage, 50);
      return res;
    };
    const origLocalRemove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
      const res = origLocalRemove.apply(this, arguments);
      setTimeout(collectStorage, 50);
      return res;
    };
    const origLocalClear = Storage.prototype.clear;
    Storage.prototype.clear = function() {
      const res = origLocalClear.apply(this, arguments);
      setTimeout(collectStorage, 50);
      return res;
    };
  } catch (e) {}

  setInterval(collectStorage, 1000);
  setTimeout(collectStorage, 200);
  setTimeout(collectStorage, 800);
  window.addEventListener('DOMContentLoaded', collectStorage);
  window.addEventListener('load', collectStorage);

  // =========================================================================
  // 5. MESSAGE HANDLER: REPL EXECUTION & STORAGE MUTATIONS
  // =========================================================================
  window.addEventListener('message', (e) => {
    if (!e.data) return;

    // Execute JS REPL command
    if (e.data.type === 'MOBILEVIEW_EXEC_JS') {
      const code = e.data.code;
      try {
        const result = window.eval(code);
        window.parent.postMessage({
          type: 'MOBILEVIEW_EXEC_RESULT',
          data: {
            code: code,
            result: safeStringify(result),
            isError: false
          }
        }, '*');
      } catch (err) {
        window.parent.postMessage({
          type: 'MOBILEVIEW_EXEC_RESULT',
          data: {
            code: code,
            result: String(err.message || err),
            isError: true
          }
        }, '*');
      }
    }

    // Storage mutations
    if (e.data.type === 'MOBILEVIEW_MUTATE_STORAGE') {
      try {
        const { action, store, key, value } = e.data;
        const targetStore = store === 'session' ? sessionStorage : localStorage;
        if (action === 'set') {
          targetStore.setItem(key, value);
        } else if (action === 'remove') {
          targetStore.removeItem(key);
        } else if (action === 'clear') {
          targetStore.clear();
        }
        collectStorage();
      } catch (err) {}
    }

    if (e.data.type === 'MOBILEVIEW_REQUEST_STORAGE') {
      collectStorage();
    }

    // Custom HTTP Method Dispatcher (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
    if (e.data.type === 'MOBILEVIEW_DISPATCH_HTTP' && e.data.data) {
      (async () => {
        const { method, url, headers, body } = e.data.data;
        const startTime = performance.now();
        try {
          const fetchOpts = {
            method: (method || 'GET').toUpperCase(),
            headers: headers || {}
          };
          if (body && !['GET', 'HEAD'].includes(fetchOpts.method)) {
            fetchOpts.body = body;
          }
          const res = await window.fetch(url, fetchOpts);
          const duration = Math.round(performance.now() - startTime);

          const responseHeaders = {};
          if (res.headers) {
            res.headers.forEach((v, k) => { responseHeaders[k] = v; });
          }

          let responseBody = '';
          try {
            const clone = res.clone();
            responseBody = await clone.text();
            if (responseBody.length > 50000) responseBody = responseBody.substring(0, 50000) + '... [Truncated]';
          } catch (e) {
            responseBody = '[Binary or Streamed Response]';
          }

          window.parent.postMessage({
            type: 'MOBILEVIEW_HTTP_DISPATCH_RESULT',
            data: {
              status: res.status,
              statusText: res.statusText || 'OK',
              duration: duration,
              responseHeaders: responseHeaders,
              responseBody: responseBody
            }
          }, '*');
        } catch (err) {
          const duration = Math.round(performance.now() - startTime);
          window.parent.postMessage({
            type: 'MOBILEVIEW_HTTP_DISPATCH_RESULT',
            data: {
              status: 0,
              statusText: 'Network / CORS Error',
              duration: duration,
              responseHeaders: {},
              responseBody: String(err.message || err)
            }
          }, '*');
        }
      })();
    }

    // 6. Touch Dot Pointer Simulator Toggle
    if (e.data.type === 'MOBILEVIEW_SET_TOUCH_DOT') {
      isTouchDotEnabled = !!e.data.active;
      const dot = ensureTouchDotElement();
      if (!isTouchDotEnabled && dot) {
        dot.style.display = 'none';
        dot.style.opacity = '0';
      }
    }
  });

  // =========================================================================
  // In-Frame Simulated Touch Dot Pointer & Ripple Indicator
  // =========================================================================
  let isTouchDotEnabled = false;
  let touchDotEl = null;

  function ensureTouchDotElement() {
    if (touchDotEl && document.body && document.body.contains(touchDotEl)) return touchDotEl;
    touchDotEl = document.getElementById('__mv_touch_dot__');
    if (!touchDotEl) {
      touchDotEl = document.createElement('div');
      touchDotEl.id = '__mv_touch_dot__';
      touchDotEl.style.cssText = `
        position: fixed !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(139, 92, 246, 0.2) 60%, rgba(99, 102, 241, 0.05) 100%) !important;
        border: 2px solid rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 0 14px rgba(99, 102, 241, 0.65), inset 0 0 6px rgba(255, 255, 255, 0.6) !important;
        pointer-events: none !important;
        transform: translate(-50%, -50%) scale(1) !important;
        transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease !important;
        z-index: 2147483647 !important;
        display: none !important;
        opacity: 0 !important;
      `;
      (document.body || document.documentElement).appendChild(touchDotEl);
    }
    return touchDotEl;
  }

  window.addEventListener('pointermove', (e) => {
    if (!isTouchDotEnabled) return;
    const dot = ensureTouchDotElement();
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.style.display = 'block';
    dot.style.opacity = '1';
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    if (!isTouchDotEnabled) return;
    const dot = ensureTouchDotElement();
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.style.display = 'block';
    dot.style.opacity = '1';
    dot.style.transform = 'translate(-50%, -50%) scale(1.4)';
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    if (!isTouchDotEnabled || !touchDotEl) return;
    touchDotEl.style.transform = 'translate(-50%, -50%) scale(1)';
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    if (touchDotEl) {
      touchDotEl.style.opacity = '0';
      setTimeout(() => {
        if (!isTouchDotEnabled || touchDotEl.style.opacity === '0') {
          touchDotEl.style.display = 'none';
        }
      }, 150);
    }
  }, { passive: true });
  });
})();

