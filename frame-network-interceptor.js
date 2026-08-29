/**
 * MobileView — In-Frame Network Traffic Interceptor (Fetch & XHR)
 * Runs directly in world: "MAIN" (No inline script elements, zero CSP violations)
 */

(() => {
  if (window.__mv_interceptor_active) return;
  window.__mv_interceptor_active = true;

  let reqCounter = 0;

  // Helper to send intercepted network events to MobileView DevTools parent
  function broadcast(details) {
    try {
      window.parent.postMessage({
        type: 'MOBILEVIEW_NETWORK_REQ',
        data: details
      }, '*');
    } catch (e) {}
  }

  // 1. Hook Fetch API
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

        broadcast({
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
        broadcast({
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

  // 2. Hook XMLHttpRequest API
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

      broadcast({
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
})();
