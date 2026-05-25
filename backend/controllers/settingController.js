import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";

const DEFAULTS = {
  freeShipping: false,
};

export const getSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  let setting = await Setting.findOne({ key });
  if (!setting) {
    setting = { key, value: DEFAULTS[key] ?? null };
  }
  res.json({ key, value: setting.value });
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
