/**
 * Simple in-memory cache for API responses
 * Reduces redundant API calls and improves performance
 */

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default

/**
 * Generate cache key from request config
 */
const getCacheKey = (config) => {
  const { method, url, params } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${method}:${url}:${paramsStr}`;
};

/**
 * Check if cache entry is still valid
 */
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const now = Date.now();
  return (now - cacheEntry.timestamp) < cacheEntry.duration;
};

/**
 * Get cached response
 */
export const getCachedResponse = (config) => {
  const key = getCacheKey(config);
  const entry = cache.get(key);
  
  if (isCacheValid(entry)) {
    return entry.data;
  }
  
  // Remove expired entry
  if (entry) {
    cache.delete(key);
  }
  
  return null;
};

/**
 * Set cached response
 */
export const setCachedResponse = (config, data, duration = CACHE_DURATION) => {
  const key = getCacheKey(config);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration
  });
};

/**
 * Clear cache for specific URL pattern
 */
export const clearCache = (urlPattern) => {
  if (!urlPattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.clear();
};

/**
 * Get cache size (for debugging)
 */
export const getCacheSize = () => {
  return cache.size;
};

