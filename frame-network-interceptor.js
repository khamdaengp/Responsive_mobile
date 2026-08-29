/**
 * MobileView — In-Frame Network Traffic Interceptor (Fetch & XHR)
 * Runs directly in world: "MAIN" (No inline script elements, zero CSP violations)
 */

(() => {
  // Prevent double hooking
  if (window.__mv_interceptor_active) return;
  window.__mv_interceptor_active = true;

  // Helper to send intercepted network events to MobileView DevTools parent
  function broadcast(reqType, method, url, status, statusText, duration) {
    try {
      let cleanUrl = String(url || '');
      if (cleanUrl.length > 80) {
        try {
          const parsed = new URL(cleanUrl, window.location.href);
          cleanUrl = parsed.pathname + parsed.search;
        } catch (e) {
          cleanUrl = cleanUrl.substring(0, 60) + '...';
        }
      }

      window.parent.postMessage({
        type: 'MOBILEVIEW_NETWORK_REQ',
        data: {
          reqType,
          method: (method || 'GET').toUpperCase(),
          url: cleanUrl,
          status: status || 200,
          statusText: statusText || 'OK',
          duration: duration || 0
        }
      }, '*');
    } catch (e) {}
  }

  // 1. Hook Fetch API
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = async function(...args) {
      const startTime = performance.now();
      let method = 'GET';
      let url = '';

      if (typeof args[0] === 'string') {
        url = args[0];
        if (args[1] && args[1].method) {
          method = args[1].method;
        }
      } else if (args[0] && typeof args[0] === 'object') {
        url = args[0].url || '';
        method = args[0].method || 'GET';
      }

      try {
        const response = await origFetch.apply(this, args);
        const duration = Math.round(performance.now() - startTime);
        broadcast('FETCH', method, url, response.status, response.statusText, duration);
        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        broadcast('FETCH', method, url, 0, 'Failed', duration);
        throw err;
      }
    };
  }

  // 2. Hook XMLHttpRequest API
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__mv_method = method;
    this.__mv_url = url;
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const startTime = performance.now();
    const method = this.__mv_method || 'GET';
    const url = this.__mv_url || '';

    this.addEventListener('loadend', () => {
      const duration = Math.round(performance.now() - startTime);
      broadcast('XHR', method, url, this.status || 200, this.statusText || 'OK', duration);
    });

    return origSend.apply(this, args);
  };
})();
