const cache = new Map();

const DEFAULT_TTL = 60 * 1000;

export const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

export const setCache = (key, data, ttl = DEFAULT_TTL) => {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
};

export const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
};

export const withCache = (fn, key, ttl) => {
  return async (...args) => {
    const cached = getCached(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    setCache(key, result, ttl);
    return result;
  };
};
