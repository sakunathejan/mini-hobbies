const store = new Map();

const DEFAULT_TTL = 60 * 1000;

export const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

export const set = (key, data, ttl = DEFAULT_TTL) => {
  store.set(key, { data, expiresAt: Date.now() + ttl });
};

export const del = (key) => {
  store.delete(key);
};

export const clear = (pattern) => {
  if (!pattern) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) store.delete(key);
  }
};

export const memoize = (fn, keyFn, ttl) => {
  return async (...args) => {
    const key = keyFn(...args);
    const cached = get(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    set(key, result, ttl);
    return result;
  };
};
