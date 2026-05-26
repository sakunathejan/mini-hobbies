import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";

const DEFAULTS = {
  freeShipping: false,
  lowStockThreshold: 3,
};

export const getSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const cacheKey = `setting:${key}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  let setting = await Setting.findOne({ key }).lean();
  if (!setting) {
    setting = { key, value: DEFAULTS[key] ?? null };
  }
  cache.set(cacheKey, { key, value: setting.value }, 2 * 60 * 1000);
  res.json({ key, value: setting.value });
});

export const getAllSettings = asyncHandler(async (_req, res) => {
  const cached = cache.get("settings:all");
  if (cached) return res.json(cached);
  const settings = await Setting.find({}).lean();
  const merged = { ...DEFAULTS };
  for (const s of settings) {
    merged[s.key] = s.value;
  }
  cache.set("settings:all", merged, 2 * 60 * 1000);
  res.json(merged);
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const setting = await Setting.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true, runValidators: true }
  );
  cache.clear("settings:");
  res.json({ key: setting.key, value: setting.value });
});
