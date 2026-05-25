import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";

const DEFAULTS = {
  freeShipping: false,
  lowStockThreshold: 3,
};

export const getSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  let setting = await Setting.findOne({ key });
  if (!setting) {
    setting = { key, value: DEFAULTS[key] ?? null };
  }
  res.json({ key, value: setting.value });
});

export const getAllSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.find({});
  const merged = { ...DEFAULTS };
  for (const s of settings) {
    merged[s.key] = s.value;
  }
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
  res.json({ key: setting.key, value: setting.value });
});
