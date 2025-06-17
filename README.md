# 👻 Ghostloader

<div align="center">

**The Intelligent Web Preloading Engine**<br>
[![MIT License](https://img.shields.io/badge/License-MIT-success.svg?style=flat-square)](https://choosealicense.com/licenses/mit/) [![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg?style=flat-square)](https://github.com/yourusername/ghostloader) [![Size](https://img.shields.io/badge/Size-~15KB-green.svg?style=flat-square)](https://github.com/yourusername/ghostloader) [![Performance](https://img.shields.io/badge/Performance-⚡Blazing-ff6b35.svg?style=flat-square)](https://github.com/yourusername/ghostloader)

*Make your web pages load at the speed of thought* 🚀

[**Quick Start**](#-quick-start) • [**Features**](#-features) • [**Documentation**](#-documentation) • [**Examples**](#-examples) • [**API Reference**](#-api-reference)

</div>

---

## 🌟 What is Ghostloader?

Ghostloader is a **lightweight, intelligent preloading engine** that makes your web pages feel instant. It silently preloads pages in the background using advanced algorithms, smart caching, and connection awareness to deliver lightning-fast navigation experiences.

### 🎯 **Why Choose Ghostloader?**

| Traditional Loading | 👻 Ghostloader Enhanced |
|-------------------|------------------------|
| 🐌 Wait for each click | ⚡ Instant page transitions |
| 📶 Ignores connection speed | 🧠 Adapts to network conditions |
| 💾 No intelligent caching | 🔄 Smart cache management |
| 🎯 No hover prediction | 🎯 Hover-based prioritization |
| 📱 Wastes mobile data | 📊 Respects data saver mode |

---

## 🚀 Quick Start

### Installation

#### NPM
```bash
npm install ghostloader
```

#### CDN
```html
<!-- UMD -->
<script src="https://cdn.jsdelivr.net/npm/ghostloader@latest/dist/ghostloader.umd.js"></script>

<!-- ESM -->
<script src="https://cdn.jsdelivr.net/npm/ghostloader@latest/dist/ghostloader.esm.js" type="module"></script>
```

### Basic Usage

```javascript
// One-liner setup with smart defaults
Ghostloader.init();

// Custom configuration
Ghostloader.init({
  cacheMode: 'local',
  instantHover: true,
  maxConcurrent: 3,
  debug: true
});
```

**That's it!** 🎉 Your website now has intelligent preloading.

---

## ✨ Features

<div align="center">

### 🧠 **Intelligent Prioritization**
*Smart algorithms prioritize links based on viewport position and user behavior*

### ⚡ **Instant Transitions** 
*Cached pages load instantly when clicked - zero wait time*

### 🌐 **Connection Aware**
*Automatically adapts to network speed and respects data saver mode*

### 🎯 **Hover Prediction**
*Boosts priority when users hover over links*

### 💾 **Advanced Caching**
*Smart cache management with expiration and cross-tab sharing*

### 🔧 **Highly Configurable**
*Fine-tune every aspect to match your needs*

</div>

---

## 📚 Documentation

### 🎛️ **Configuration Options**

<details>
<summary><strong>🔧 Core Settings</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheMode` | `string` | `'local'` | Cache mode: `'local'` (same-origin) or `'external'` (CORS) |
| `instantHover` | `boolean` | `true` | Enable hover-based priority boosting |
| `maxConcurrent` | `number` | `3` | Maximum concurrent requests |
| `selector` | `string` | `'a[href]'` | CSS selector for links to preload |

</details>

<details>
<summary><strong>⏱️ Timing & Delays</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialDelay` | `number` | `1000` | Delay before starting preloading (ms) |
| `betweenDelay` | `number` | `100` | Delay between processing queue items (ms) |
| `hoverDelay` | `number` | `150` | Delay before boosting hovered links (ms) |

</details>

<details>
<summary><strong>🚫 Exclusion Patterns</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `excludeSelectors` | `Array<string>` | `[...]` | CSS selectors to exclude from preloading |
| `excludePatterns` | `Array<RegExp>` | `[...]` | Regex patterns to exclude URLs |

**Default Exclusions:**
```javascript
excludeSelectors: [
  '[download]',           // Download links
  '[target="_blank"]',    // External links
  '[href^="mailto:"]',    // Email links
  '[href^="tel:"]',       // Phone links
  '[href^="#"]',          // Hash links
  '.no-preload'           // Custom class
]

excludePatterns: [
  /\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx)$/i,  // Documents
  /\.(jpg|jpeg|png|gif|svg|webp)$/i,           // Images
  /^javascript:/,                               // JavaScript URLs
  /^data:/                                      // Data URLs
]
```

</details>

<details>
<summary><strong>🌐 Network & Performance</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fetchHeaders` | `Object` | `{}` | Custom headers for requests |
| `requestTimeout` | `number` | `10000` | Request timeout in ms |
| `connectionAware` | `boolean` | `true` | Enable connection-aware optimizations |
| `dataLimit` | `number` | `52428800` | Session data limit (50MB) |
| `bandwidthThrottle` | `boolean` | `true` | Throttle based on connection speed |

</details>

<details>
<summary><strong>💾 Cache Configuration</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheMaxSize` | `number` | `100` | Maximum cached items |
| `cacheExpiration` | `number` | `86400000` | Cache expiration (24 hours) |
| `cacheVersion` | `string` | `'1.0'` | Cache version identifier |
| `crossTabCache` | `boolean` | `true` | Enable cross-tab cache sharing |

</details>

<details>
<summary><strong>🐛 Debug & Logging</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | `boolean` | `false` | Enable debug logging |
| `verboseLogging` | `boolean` | `false` | Enable verbose logging |

</details>

<details>
<summary><strong>🚀 Advanced Features</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `instantTransitions` | `boolean` | `true` | Enable instant page transitions |
| `ssrHints` | `boolean` | `true` | Process server-side rendering hints |

</details>

---

## 💡 Examples

### 🎯 **Basic Setup**

```javascript
// Minimal setup - uses smart defaults
Ghostloader.init();
```

### 🔧 **Custom Configuration**

```javascript
Ghostloader.init({
  // Core settings
  cacheMode: 'external',
  maxConcurrent: 5,
  
  // Timing
  initialDelay: 2000,
  hoverDelay: 100,
  
  // Custom exclusions
  excludeSelectors: ['.no-preload', '[data-external]'],
  
  // Network settings
  connectionAware: true,
  dataLimit: 25 * 1024 * 1024, // 25MB
  
  // Debug
  debug: true
});
```

### 🌐 **E-commerce Optimized**

```javascript
Ghostloader.init({
  cacheMode: 'local',
  maxConcurrent: 2,
  hoverDelay: 200,
  
  // Exclude cart and checkout links
  excludeSelectors: [
    '.add-to-cart',
    '[href*="/checkout"]',
    '[href*="/cart"]',
    '.no-preload'
  ],
  
  // Conservative data usage
  dataLimit: 10 * 1024 * 1024, // 10MB
  connectionAware: true,
  
  // Custom headers for analytics
  fetchHeaders: {
    'X-Preload-Source': 'ghostloader',
    'X-User-Agent': 'Ghostloader/0.2'
  }
});
```

### 📱 **Mobile Optimized**

```javascript
Ghostloader.init({
  // Aggressive bandwidth throttling
  bandwidthThrottle: true,
  maxConcurrent: 1,
  
  // Longer delays for mobile
  initialDelay: 3000,
  betweenDelay: 500,
  hoverDelay: 300,
  
  // Smaller cache for mobile
  cacheMaxSize: 20,
  dataLimit: 5 * 1024 * 1024, // 5MB
  
  // Respect data saver
  connectionAware: true
});
```

### 🏢 **Enterprise Setup**

```javascript
const ghostloader = Ghostloader.init({
  cacheMode: 'external',
  maxConcurrent: 10,
  
  // Custom authentication
  fetchHeaders: {
    'Authorization': 'Bearer ' + getAuthToken(),
    'X-API-Version': '2.0',
    'X-Client-ID': 'enterprise-app'
  },
  
  // Large cache for intranet
  cacheMaxSize: 500,
  cacheExpiration: 4 * 60 * 60 * 1000, // 4 hours
  
  // Custom exclusions for enterprise
  excludeSelectors: [
    '[href*="/admin"]',
    '[href*="/logout"]',
    '.secure-link'
  ],
  
  debug: true,
  verboseLogging: true
});

// Monitor performance
setInterval(() => {
  console.log('Ghostloader Stats:', ghostloader.getStats());
}, 30000);
```

---

## 🔗 Server-Side Rendering Hints

Boost performance by providing server-side hints about which pages to prioritize:

### 📝 **Meta Tag Hints**

```html
<!-- High priority pages -->
<meta name="ghostloader-hint" content="/important-page" data-priority="high">
<meta name="ghostloader-hint" content="/popular-product" data-priority="high">

<!-- Normal priority pages -->
<meta name="ghostloader-hint" content="/related-article" data-priority="normal">
```

### 📊 **JSON-LD Hints**

```html
<script type="application/ld+json">
{
  "ghostloaderHints": [
    { "url": "/next-chapter", "priority": -500 },
    { "url": "/recommended-product", "priority": -300 },
    { "url": "/related-content", "priority": 100 }
  ]
}
</script>
```

---

## 📊 API Reference

### 🏗️ **Initialization**

```javascript
const ghostloader = Ghostloader.init(options);
```

### 🎛️ **Control Methods**

```javascript
// Pause/Resume
ghostloader.pause();
ghostloader.resume();

// Cache management
await ghostloader.clearCache();

// Cleanup
ghostloader.destroy();
```

### 📈 **Statistics & Monitoring**

```javascript
const stats = ghostloader.getStats();
console.log(stats);

/*
Returns:
{
  // Queue information
  queueLength: 5,
  processing: 2,
  processed: 15,
  activeRequests: 2,
  
  // Performance metrics
  totalRequests: 20,
  cacheHits: 12,
  cacheMisses: 8,
  cacheHitRate: "60.00%",
  
  // Network information
  connectionType: "4g",
  dataUsed: 1048576,
  dataUsagePercent: "2.00%",
  
  // Feature status
  features: {
    instantHover: true,
    instantTransitions: true,
    connectionAware: true,
    crossTabCache: true
  }
}
*/
```

---

## 🎨 Advanced Usage

### 🔄 **Dynamic Configuration**

```javascript
const ghostloader = Ghostloader.init({ debug: false });

// Update configuration dynamically
ghostloader.config.debug = true;
ghostloader.config.maxConcurrent = 5;

// Rebuild queue with new settings
ghostloader.buildQueue();
```

### 📡 **Event Monitoring**

```javascript
// Monitor cache events (if using cross-tab)
if (ghostloader.broadcastChannel) {
  ghostloader.broadcastChannel.addEventListener('message', (event) => {
    console.log('Cache event:', event.data);
  });
}

// Monitor connection changes
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    console.log('Connection changed:', navigator.connection.effectiveType);
  });
}
```

### 🧪 **Testing & Development**

```javascript
// Development mode with immediate preloading
Ghostloader.init({
  debug: true,
  verboseLogging: true,
  initialDelay: 0,
  betweenDelay: 0,
  hoverDelay: 0,
  maxConcurrent: 1 // Easy to debug
});

// Production monitoring
const ghostloader = Ghostloader.init({
  debug: false,
  // ... other options
});

// Send stats to analytics
setInterval(() => {
  const stats = ghostloader.getStats();
  analytics.track('ghostloader_performance', {
    cacheHitRate: stats.cacheHitRate,
    avgResponseTime: stats.averageResponseTime,
    dataUsage: stats.dataUsed
  });
}, 60000);
```

---

## 🛠️ Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | All features supported |
| Edge | ✅ Full | All features supported |
| IE11 | ⚠️ Partial | No Cache API, falls back to memory |

---

## 🚀 Performance Tips

### ⚡ **Optimization Strategies**

1. **🎯 Start Small**: Begin with default settings, then optimize
2. **📊 Monitor Stats**: Use `getStats()` to identify bottlenecks
3. **🌐 Respect Networks**: Keep `connectionAware: true`
4. **💾 Tune Cache Size**: Adjust `cacheMaxSize` based on your content
5. **🚫 Exclude Wisely**: Add specific exclusions for your site

### 📈 **Performance Metrics**

```javascript
// Monitor key metrics
const stats = ghostloader.getStats();

// Good performance indicators:
// - Cache hit rate > 70%
// - Average response time < 500ms
// - Data usage within limits
// - Active requests < maxConcurrent

console.log(`Cache efficiency: ${stats.cacheHitRate}`);
console.log(`Avg response: ${stats.averageResponseTime}`);
console.log(`Data usage: ${stats.dataUsagePercent}`);
```

### 🐛 **Bug Reports**

Found a bug? Please include:
- Browser and version
- Ghostloader configuration
- Steps to reproduce
- Expected vs actual behavior

---

## 📄 License

**MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🚀 **Ready to make your website blazing fast?**

```javascript
Ghostloader.init();
```

**[⭐ Star us on GitHub](https://github.com/orielhaim/ghostloader)**

---

*Made with 👻 and ❤️ by [orielhaim](https://orielhaim.com)*

</div> 