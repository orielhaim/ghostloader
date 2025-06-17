/**
 * Ghostloader - Lightweight Smart Preloading Engine
 * Version 0.2
 */

class Ghostloader {
  constructor() {
    this.config = {
      cacheMode: 'local', // local or external
      instantHover: true, // if true, the preloading will be boosted when the mouse is over the link
      maxConcurrent: 3, // the maximum number of concurrent requests
      selector: 'a[href]', // the selector to use to find the links to preload

      // New delay configurations
      initialDelay: 1000, // delay before starting preloading (ms)
      betweenDelay: 100, // delay between processing queue items (ms)
      hoverDelay: 150, // delay before boosting hovered links (ms)

      // Exclusion patterns
      excludeSelectors: [
        '[download]',
        '[target="_blank"]',
        '[href^="mailto:"]',
        '[href^="tel:"]',
        '[href^="#"]',
        '.no-preload'
      ],
      excludePatterns: [
        /\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx)$/i,
        /\.(jpg|jpeg|png|gif|svg|webp)$/i,
        /^javascript:/,
        /^data:/
      ],

      // Network and performance
      fetchHeaders: {},
      requestTimeout: 10000, // 10 seconds
      connectionAware: true,
      dataLimit: 50 * 1024 * 1024, // 50MB per session
      bandwidthThrottle: true,

      // Cache configuration
      cacheMaxSize: 100, // maximum number of cached items
      cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours in ms
      cacheVersion: '1.0',
      crossTabCache: true,

      // Debug and logging
      debug: false,
      verboseLogging: false,

      // Advanced features
      instantTransitions: true,
      ssrHints: true
    };

    this.queue = [];
    this.processing = new Set();
    this.processed = new Set();
    this.cache = new Map(); // Fallback cache
    this.cacheAPI = null;
    this.isInitialized = false;
    this.activeRequests = 0;

    // New state tracking
    this.hoverTimeouts = new Map();
    this.dataUsed = 0;
    this.sessionStart = Date.now();
    this.connectionInfo = null;
    this.bandwidthEstimate = null;
    this.ssrHintsReceived = new Set();

    // Performance monitoring
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesTransferred: 0,
      averageResponseTime: 0,
      connectionType: 'unknown'
    };

    // Cross-tab communication
    this.broadcastChannel = null;
  }

  /**
   * Initialize Ghostloader with custom options
   * @param {Object} options - Configuration options
   */
  static init(options = {}) {
    const instance = new Ghostloader();
    instance.configure(options);
    instance.start();
    return instance;
  }

  /**
   * Configure the instance with user options
   * @param {Object} options - Configuration options
   */
  configure(options) {
    this.config = { ...this.config, ...options };
    this.log('Configured with options:', this.config);
  }

  /**
   * Start the preloading process
   */
  async start() {
    if (this.isInitialized) {
      this.debugLog('Already initialized');
      return;
    }

    this.debugLog('Starting Ghostloader...');

    // Detect connection information
    if (this.config.connectionAware) {
      await this.detectConnection();
    }

    // Set up cross-tab communication
    if (this.config.crossTabCache) {
      this.setupCrossTabCache();
    }

    // Initialize cache system
    await this.initializeCache();

    // Process server-side rendering hints
    if (this.config.ssrHints) {
      this.processSSRHints();
    }

    // Apply initial delay before starting
    if (this.config.initialDelay > 0) {
      this.debugLog(`Waiting ${this.config.initialDelay}ms before starting preloading`);
      await this.delay(this.config.initialDelay);
    }

    // Build initial queue from visible links
    this.buildQueue();

    // Set up instant hover listeners if enabled
    if (this.config.instantHover) {
      this.setupHoverListeners();
    }

    // Set up instant transitions if enabled
    if (this.config.instantTransitions) {
      this.setupInstantTransitions();
    }

    // Start processing queue
    this.processQueue();

    this.isInitialized = true;
    this.debugLog('Ghostloader initialized successfully');
  }

  /**
   * Initialize cache system (Cache API or fallback)
   */
  async initializeCache() {
    try {
      if ('caches' in window) {
        this.cacheAPI = await caches.open('ghostloader-cache-v1');
        this.log('Cache API initialized');
      } else {
        this.log('Cache API not available, using memory fallback');
      }
    } catch (error) {
      this.log('Cache API initialization failed, using memory fallback:', error);
    }
  }

  /**
   * Build priority queue from visible links, sorted by DOM position
   */
  buildQueue() {
    const links = document.querySelectorAll(this.config.selector);
    const linkData = [];

    links.forEach(link => {
      const href = this.normalizeUrl(link.href);

      // Skip if already processed or invalid
      if (!href || this.processed.has(href) || this.processing.has(href)) {
        return;
      }

      // Check exclusion patterns
      if (this.shouldExclude(link, href)) {
        this.verboseLog('Excluded link:', href);
        return;
      }

      // Check cache mode restrictions
      if (!this.shouldPreload(href)) {
        return;
      }

      // Check data usage limits
      if (this.config.connectionAware && !this.withinDataLimits()) {
        this.debugLog('Data limit reached, skipping preloading');
        return;
      }

      // Get element position for priority sorting
      const rect = link.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        linkData.push({
          url: href,
          element: link,
          priority: rect.top, // Top-to-bottom priority
          timestamp: Date.now()
        });
      }
    });

    // Sort by priority (top to bottom)
    linkData.sort((a, b) => a.priority - b.priority);

    this.queue = linkData;
    this.debugLog(`Built queue with ${this.queue.length} links`);
  }

  /**
   * Check if URL should be preloaded based on cache mode
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  shouldPreload(url) {
    try {
      const urlObj = new URL(url);
      const currentOrigin = window.location.origin;

      if (this.config.cacheMode === 'local') {
        return urlObj.origin === currentOrigin;
      }

      // For external mode, allow all URLs (CORS will be handled during fetch)
      return true;
    } catch (error) {
      this.log('Invalid URL:', url, error);
      return false;
    }
  }

  /**
   * Normalize URL for consistent caching
   * @param {string} url - URL to normalize
   * @returns {string|null}
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      // Remove hash for caching purposes
      urlObj.hash = '';
      return urlObj.href;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set up hover listeners for instant priority boost
   */
  setupHoverListeners() {
    document.addEventListener('mouseenter', (event) => {
      if (event.target.matches(this.config.selector)) {
        const href = this.normalizeUrl(event.target.href);
        if (href && this.shouldPreload(href) && !this.shouldExclude(event.target, href)) {
          // Clear any existing timeout for this element
          if (this.hoverTimeouts.has(event.target)) {
            clearTimeout(this.hoverTimeouts.get(event.target));
          }

          // Set hover delay threshold
          const timeoutId = setTimeout(() => {
            this.boostPriority(href);
            this.hoverTimeouts.delete(event.target);
          }, this.config.hoverDelay);

          this.hoverTimeouts.set(event.target, timeoutId);
        }
      }
    }, true);

    // Clean up hover timeouts on mouse leave
    document.addEventListener('mouseleave', (event) => {
      if (event.target.matches(this.config.selector)) {
        if (this.hoverTimeouts.has(event.target)) {
          clearTimeout(this.hoverTimeouts.get(event.target));
          this.hoverTimeouts.delete(event.target);
        }
      }
    }, true);

    this.debugLog('Hover listeners enabled with', this.config.hoverDelay, 'ms delay');
  }

  /**
   * Move hovered link to front of queue
   * @param {string} url - URL to boost
   */
  boostPriority(url) {
    // Find link in queue
    const index = this.queue.findIndex(item => item.url === url);

    if (index > 0) {
      // Move to front
      const item = this.queue.splice(index, 1)[0];
      this.queue.unshift(item);
      this.log('Boosted priority for:', url);

      // Trigger immediate processing if not at max concurrency
      this.processQueue();
    }
  }

  /**
   * Process the queue with concurrency control
   */
  async processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.getEffectiveMaxConcurrent()) {
      const item = this.queue.shift();

      if (!item || this.processing.has(item.url) || this.processed.has(item.url)) {
        continue;
      }

      // Check data limits before processing
      if (this.config.connectionAware && !this.withinDataLimits()) {
        this.debugLog('Data limit reached, pausing queue processing');
        break;
      }

      this.processing.add(item.url);
      this.activeRequests++;

      // Apply between-delay if configured
      if (this.config.betweenDelay > 0 && this.activeRequests > 1) {
        await this.delay(this.config.betweenDelay);
      }

      // Process item asynchronously
      this.fetchAndCache(item).finally(() => {
        this.processing.delete(item.url);
        this.processed.add(item.url);
        this.activeRequests--;

        // Continue processing queue
        if (this.queue.length > 0) {
          // Small delay before continuing to prevent overwhelming
          setTimeout(() => this.processQueue(), 10);
        }
      });
    }
  }

  /**
   * Fetch and cache a page
   * @param {Object} item - Queue item with url and metadata
   */
  async fetchAndCache(item) {
    const { url } = item;
    const startTime = Date.now();

    try {
      this.verboseLog('Fetching:', url);
      this.stats.totalRequests++;

      // Check if already cached and not expired
      const cachedResponse = await this.getCachedResponse(url);
      if (cachedResponse && !this.isCacheExpired(cachedResponse)) {
        this.debugLog('Cache hit:', url);
        this.stats.cacheHits++;
        return;
      }

      // Prepare fetch options with custom headers and timeout
      const fetchOptions = {
        method: 'GET',
        mode: this.config.cacheMode === 'external' ? 'cors' : 'same-origin',
        credentials: 'same-origin',
        cache: 'default',
        headers: {
          ...this.config.fetchHeaders,
          'X-Ghostloader': 'preload',
          'X-Ghostloader-Version': this.config.cacheVersion
        }
      };

      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
      fetchOptions.signal = controller.signal;

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (response.ok) {
        // Track data usage
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          this.dataUsed += parseInt(contentLength, 10);
        }

        // Store in cache with versioning
        await this.storeInCache(url, response.clone(), {
          timestamp: Date.now(),
          version: this.config.cacheVersion,
          size: contentLength ? parseInt(contentLength, 10) : 0
        });

        this.debugLog('Cached:', url);
        this.stats.cacheMisses++;
        this.stats.bytesTransferred += contentLength ? parseInt(contentLength, 10) : 0;

        // Broadcast to other tabs
        this.broadcastCacheUpdate(url, 'cached');

      } else {
        this.debugLog('Fetch failed:', url, response.status);
      }

      // Update performance stats
      const responseTime = Date.now() - startTime;
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;

    } catch (error) {
      if (error.name === 'AbortError') {
        this.debugLog('Request timeout:', url);
      } else {
        this.debugLog('Fetch error:', url, error.message);
      }
    }
  }

  /**
   * Check if URL is in cache
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  async isInCache(url) {
    try {
      if (this.cacheAPI) {
        const response = await this.cacheAPI.match(url);
        return !!response;
      } else {
        return this.cache.has(url);
      }
    } catch (error) {
      this.log('Cache check error:', error);
      return false;
    }
  }

  /**
   * Store response in cache
   * @param {string} url - URL to cache
   * @param {Response} response - Response to store
   */
  async storeInCache(url, response) {
    try {
      if (this.cacheAPI) {
        await this.cacheAPI.put(url, response);
      } else {
        // Store minimal data in memory fallback
        this.cache.set(url, {
          url,
          timestamp: Date.now(),
          status: response.status
        });
      }
    } catch (error) {
      this.log('Cache store error:', error);
    }
  }

  /**
   * Check if URL should be excluded based on patterns
   * @param {HTMLElement} element - Link element
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  shouldExclude(element, url) {
    // Check selector exclusions
    for (const selector of this.config.excludeSelectors) {
      if (element.matches(selector)) {
        return true;
      }
    }

    // Check pattern exclusions
    for (const pattern of this.config.excludePatterns) {
      if (pattern.test(url)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect connection information
   */
  async detectConnection() {
    try {
      if ('connection' in navigator) {
        this.connectionInfo = navigator.connection;
        this.stats.connectionType = this.connectionInfo.effectiveType || 'unknown';

        // Estimate bandwidth
        if (this.connectionInfo.downlink) {
          this.bandwidthEstimate = this.connectionInfo.downlink * 1000 * 1000; // Convert to bytes/s
        }

        this.debugLog('Connection detected:', {
          type: this.connectionInfo.effectiveType,
          downlink: this.connectionInfo.downlink,
          saveData: this.connectionInfo.saveData
        });

        // Listen for connection changes
        this.connectionInfo.addEventListener('change', () => {
          this.debugLog('Connection changed:', this.connectionInfo.effectiveType);
          this.stats.connectionType = this.connectionInfo.effectiveType;
        });
      }
    } catch (error) {
      this.debugLog('Connection detection failed:', error);
    }
  }

  /**
   * Check if within data usage limits
   * @returns {boolean}
   */
  withinDataLimits() {
    // Respect data saver mode
    if (this.connectionInfo && this.connectionInfo.saveData) {
      this.debugLog('Data saver mode enabled, skipping preload');
      return false;
    }

    // Check session data limit
    if (this.dataUsed >= this.config.dataLimit) {
      return false;
    }

    return true;
  }

  /**
   * Get effective max concurrent requests based on connection
   * @returns {number}
   */
  getEffectiveMaxConcurrent() {
    if (!this.config.bandwidthThrottle || !this.connectionInfo) {
      return this.config.maxConcurrent;
    }

    // Throttle based on connection type
    const connectionLimits = {
      'slow-2g': 1,
      '2g': 1,
      '3g': 2,
      '4g': this.config.maxConcurrent,
      '5g': this.config.maxConcurrent
    };

    return connectionLimits[this.connectionInfo.effectiveType] || this.config.maxConcurrent;
  }

  /**
   * Set up cross-tab cache communication
   */
  setupCrossTabCache() {
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('ghostloader-cache');

        this.broadcastChannel.addEventListener('message', (event) => {
          const { type, url, data } = event.data;

          if (type === 'cache-update') {
            this.verboseLog('Received cache update from another tab:', url);
            // Mark as processed to avoid duplicate fetching
            this.processed.add(url);
          } else if (type === 'cache-invalidate') {
            this.verboseLog('Received cache invalidation from another tab:', url);
            this.invalidateCache(url);
          }
        });

        this.debugLog('Cross-tab cache communication enabled');
      }
    } catch (error) {
      this.debugLog('Cross-tab cache setup failed:', error);
    }
  }

  /**
   * Broadcast cache update to other tabs
   * @param {string} url - URL that was cached
   * @param {string} action - Action type
   */
  broadcastCacheUpdate(url, action) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'cache-update',
        url,
        action,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Process server-side rendering hints
   */
  processSSRHints() {
    try {
      // Look for SSR hints in meta tags
      const ssrHints = document.querySelectorAll('meta[name="ghostloader-hint"]');
      ssrHints.forEach(meta => {
        const url = meta.getAttribute('content');
        const priority = meta.getAttribute('data-priority') || 'normal';

        if (url && !this.ssrHintsReceived.has(url)) {
          this.ssrHintsReceived.add(url);

          // Add to queue with high priority if specified
          if (priority === 'high') {
            this.queue.unshift({
              url: this.normalizeUrl(url),
              element: null,
              priority: -1000, // Very high priority
              timestamp: Date.now(),
              source: 'ssr-hint'
            });
          }

          this.verboseLog('Processed SSR hint:', url, 'priority:', priority);
        }
      });

      // Look for hints in JSON-LD scripts
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          if (data.ghostloaderHints && Array.isArray(data.ghostloaderHints)) {
            data.ghostloaderHints.forEach(hint => {
              if (hint.url && !this.ssrHintsReceived.has(hint.url)) {
                this.ssrHintsReceived.add(hint.url);
                this.queue.unshift({
                  url: this.normalizeUrl(hint.url),
                  element: null,
                  priority: hint.priority || 0,
                  timestamp: Date.now(),
                  source: 'ssr-hint-json'
                });
              }
            });
          }
        } catch (e) {
          // Ignore invalid JSON-LD
        }
      });

    } catch (error) {
      this.debugLog('SSR hints processing failed:', error);
    }
  }

  /**
   * Set up instant page transitions
   */
  setupInstantTransitions() {
    document.addEventListener('click', async (event) => {
      if (event.target.matches(this.config.selector) && !event.defaultPrevented) {
        const href = this.normalizeUrl(event.target.href);

        if (href && await this.isInCache(href) && !this.shouldExclude(event.target, href)) {
          const cachedResponse = await this.getCachedResponse(href);

          if (cachedResponse && !this.isCacheExpired(cachedResponse)) {
            // Prevent default navigation
            event.preventDefault();

            try {
              // Get cached content
              const html = await cachedResponse.text();

              // Create new document
              const parser = new DOMParser();
              const newDoc = parser.parseFromString(html, 'text/html');

              // Replace current page content
              document.title = newDoc.title;
              document.head.innerHTML = newDoc.head.innerHTML;
              document.body.innerHTML = newDoc.body.innerHTML;

              // Update URL
              history.pushState(null, newDoc.title, href);

              // Reinitialize Ghostloader for new page
              setTimeout(() => {
                this.buildQueue();
                this.processQueue();
              }, 100);

              this.debugLog('Instant transition to:', href);

            } catch (error) {
              this.debugLog('Instant transition failed:', error);
              // Fallback to normal navigation
              window.location.href = href;
            }
          }
        }
      }
    });

    this.debugLog('Instant transitions enabled');
  }

  /**
   * Get cached response with metadata
   * @param {string} url - URL to check
   * @returns {Response|null}
   */
  async getCachedResponse(url) {
    try {
      if (this.cacheAPI) {
        return await this.cacheAPI.match(url);
      } else if (this.cache.has(url)) {
        const cached = this.cache.get(url);
        // Return a mock response for memory cache
        return {
          ok: true,
          status: 200,
          text: () => Promise.resolve(cached.content || ''),
          clone: () => this.getCachedResponse(url),
          headers: new Map([['x-cached-timestamp', cached.timestamp.toString()]])
        };
      }
    } catch (error) {
      this.debugLog('Cache retrieval error:', error);
    }
    return null;
  }

  /**
   * Check if cache entry is expired
   * @param {Response} response - Cached response
   * @returns {boolean}
   */
  isCacheExpired(response) {
    try {
      const timestamp = response.headers.get('x-cached-timestamp') ||
        response.headers.get('x-ghostloader-timestamp');

      if (timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        return age > this.config.cacheExpiration;
      }
    } catch (error) {
      this.debugLog('Cache expiration check error:', error);
    }
    return false;
  }

  /**
   * Store response in cache with metadata
   * @param {string} url - URL to cache
   * @param {Response} response - Response to store
   * @param {Object} metadata - Additional metadata
   */
  async storeInCache(url, response, metadata = {}) {
    try {
      // Enforce cache size limits
      await this.enforceCacheLimit();

      if (this.cacheAPI) {
        // Add custom headers for metadata
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'x-ghostloader-timestamp': metadata.timestamp || Date.now(),
            'x-ghostloader-version': metadata.version || this.config.cacheVersion,
            'x-ghostloader-size': metadata.size || 0
          }
        });

        await this.cacheAPI.put(url, modifiedResponse);
      } else {
        // Store in memory cache
        const content = await response.text();
        this.cache.set(url, {
          url,
          content,
          timestamp: metadata.timestamp || Date.now(),
          version: metadata.version || this.config.cacheVersion,
          size: metadata.size || content.length
        });
      }
    } catch (error) {
      this.debugLog('Cache store error:', error);
    }
  }

  /**
   * Enforce cache size limits
   */
  async enforceCacheLimit() {
    try {
      if (this.cacheAPI) {
        const keys = await this.cacheAPI.keys();
        if (keys.length >= this.config.cacheMaxSize) {
          // Remove oldest entries (simple FIFO for now)
          const toRemove = keys.slice(0, keys.length - this.config.cacheMaxSize + 10);
          await Promise.all(toRemove.map(request => this.cacheAPI.delete(request)));
          this.debugLog('Cleaned cache, removed', toRemove.length, 'entries');
        }
      } else {
        if (this.cache.size >= this.config.cacheMaxSize) {
          // Remove oldest entries from memory cache
          const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

          const toRemove = entries.slice(0, entries.length - this.config.cacheMaxSize + 10);
          toRemove.forEach(([key]) => this.cache.delete(key));
          this.debugLog('Cleaned memory cache, removed', toRemove.length, 'entries');
        }
      }
    } catch (error) {
      this.debugLog('Cache cleanup error:', error);
    }
  }

  /**
   * Invalidate cache entry
   * @param {string} url - URL to invalidate
   */
  async invalidateCache(url) {
    try {
      if (this.cacheAPI) {
        await this.cacheAPI.delete(url);
      } else {
        this.cache.delete(url);
      }
      this.debugLog('Invalidated cache for:', url);
    } catch (error) {
      this.debugLog('Cache invalidation error:', error);
    }
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debug logging utility
   * @param {...any} args - Arguments to log
   */
  debugLog(...args) {
    if (this.config.debug && typeof console !== 'undefined') {
      console.log('[Ghostloader Debug]', ...args);
    }
  }

  /**
   * Verbose logging utility
   * @param {...any} args - Arguments to log
   */
  verboseLog(...args) {
    if (this.config.verboseLogging && typeof console !== 'undefined') {
      console.log('[Ghostloader Verbose]', ...args);
    }
  }

  /**
   * Simple logging utility (kept for backward compatibility)
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    this.debugLog(...args);
  }

  /**
   * Get comprehensive cache and performance statistics
   * @returns {Object} Enhanced stats
   */
  getStats() {
    const cacheSize = this.cacheAPI ? 'Cache API' : this.cache.size;
    const sessionDuration = Date.now() - this.sessionStart;

    return {
      // Queue information
      queueLength: this.queue.length,
      processing: this.processing.size,
      processed: this.processed.size,
      activeRequests: this.activeRequests,

      // Cache information
      cacheSize,
      cacheMaxSize: this.config.cacheMaxSize,
      cacheExpiration: this.config.cacheExpiration,
      cacheVersion: this.config.cacheVersion,

      // Performance metrics
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: this.stats.totalRequests > 0 ?
        (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%',

      // Network information
      connectionType: this.stats.connectionType,
      bandwidthEstimate: this.bandwidthEstimate,
      dataUsed: this.dataUsed,
      dataLimit: this.config.dataLimit,
      dataUsagePercent: ((this.dataUsed / this.config.dataLimit) * 100).toFixed(2) + '%',

      // Timing information
      sessionDuration,
      averageResponseTime: this.stats.averageResponseTime.toFixed(2) + 'ms',
      bytesTransferred: this.stats.bytesTransferred,

      // Feature status
      features: {
        instantHover: this.config.instantHover,
        instantTransitions: this.config.instantTransitions,
        connectionAware: this.config.connectionAware,
        crossTabCache: this.config.crossTabCache && !!this.broadcastChannel,
        ssrHints: this.config.ssrHints,
        debug: this.config.debug,
        verboseLogging: this.config.verboseLogging
      },

      // Configuration
      config: {
        initialDelay: this.config.initialDelay,
        betweenDelay: this.config.betweenDelay,
        hoverDelay: this.config.hoverDelay,
        maxConcurrent: this.config.maxConcurrent,
        effectiveMaxConcurrent: this.getEffectiveMaxConcurrent(),
        requestTimeout: this.config.requestTimeout
      }
    };
  }

  /**
   * Clear all caches and reset state
   */
  async clearCache() {
    try {
      if (this.cacheAPI) {
        const keys = await this.cacheAPI.keys();
        await Promise.all(keys.map(request => this.cacheAPI.delete(request)));
      }

      this.cache.clear();
      this.processed.clear();
      this.processing.clear();
      this.queue = [];
      this.dataUsed = 0;

      // Broadcast cache clear to other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'cache-clear',
          timestamp: Date.now()
        });
      }

      this.debugLog('Cache cleared');
    } catch (error) {
      this.debugLog('Cache clear error:', error);
    }
  }

  /**
   * Pause preloading
   */
  pause() {
    this.isPaused = true;
    this.debugLog('Preloading paused');
  }

  /**
   * Resume preloading
   */
  resume() {
    this.isPaused = false;
    this.processQueue();
    this.debugLog('Preloading resumed');
  }

  /**
   * Cleanup resources and event listeners
   */
  destroy() {
    // Clear all timeouts
    this.hoverTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.hoverTimeouts.clear();

    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    // Clear caches
    this.clearCache();

    // Remove connection listener
    if (this.connectionInfo && this.connectionInfo.removeEventListener) {
      this.connectionInfo.removeEventListener('change', this.connectionChangeHandler);
    }

    this.debugLog('Ghostloader destroyed');
  }
}

// Export for ES modules and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Ghostloader;
} else if (typeof window !== 'undefined') {
  window.Ghostloader = Ghostloader;
}

export default Ghostloader;
