import ChatConfig, { getAllConfig, getDefaultConfig, getConfigValue } from "../../models/chat/ChatConfig.js";
import * as cache from "../../utils/cache.js";

const CONFIG_CACHE_KEY = "chat:admin:config";
const CONFIG_CACHE_TTL = 2 * 60 * 1000;

export const getConfig = async (forceRefresh = false) => {
  if (forceRefresh) cache.del(CONFIG_CACHE_KEY);

  let config = cache.get(CONFIG_CACHE_KEY);
  if (!config) {
    config = await getAllConfig();
    cache.set(CONFIG_CACHE_KEY, config, CONFIG_CACHE_TTL);
  }
  return config;
};

export const updateConfig = async (key, value, adminId) => {
  const defaults = getDefaultConfig();
  if (defaults[key] === undefined) throw new Error(`Invalid config key: ${key}`);

  const merged = { ...defaults[key], ...value };

  await ChatConfig.findOneAndUpdate(
    { key },
    { key, value: merged, updatedBy: adminId },
    { upsert: true, new: true }
  );

  cache.del(CONFIG_CACHE_KEY);
  return { [key]: merged };
};

export const updateConfigBulk = async (updates, adminId) => {
  const defaults = getDefaultConfig();
  const results = {};

  for (const [key, value] of Object.entries(updates)) {
    if (defaults[key] === undefined) continue;
    const merged = { ...defaults[key], ...value };
    await ChatConfig.findOneAndUpdate(
      { key },
      { key, value: merged, updatedBy: adminId },
      { upsert: true, new: true }
    );
    results[key] = merged;
  }

  cache.del(CONFIG_CACHE_KEY);
  return results;
};

export const resetConfig = async (key, adminId) => {
  const defaults = getDefaultConfig();
  if (defaults[key] === undefined) throw new Error(`Invalid config key: ${key}`);

  await ChatConfig.findOneAndUpdate(
    { key },
    { key, value: defaults[key], updatedBy: adminId },
    { upsert: true, new: true }
  );

  cache.del(CONFIG_CACHE_KEY);
  return { [key]: defaults[key] };
};
