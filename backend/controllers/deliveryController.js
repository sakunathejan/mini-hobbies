import DeliveryZone from "../models/DeliveryZone.js";
import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeTo } from "../utils/normalizeAddress.js";
import * as cache from "../utils/cache.js";

const calcShipping = (totalWeightKg, zone) => {
  if (!zone) return null;
  if (totalWeightKg <= 1) return zone.firstKgCharge;
  return zone.firstKgCharge + Math.ceil(totalWeightKg - 1) * zone.additionalKgCharge;
};

const getDefaultOrigin = async () => {
  try {
    const zones = await DeliveryZone.distinct("from", { isActive: true });
    if (zones.length === 1) return zones[0];
    const setting = await Setting.findOne({ key: "defaultShippingOrigin" }).lean();
    return setting?.value || "Colombo";
  } catch {
    return "Colombo";
  }
};

export const getCities = asyncHandler(async (req, res) => {
  const cached = cache.get("delivery-cities");
  if (cached) return res.json(cached);

  const cities = await DeliveryZone.distinct("to", { isActive: true });
  cities.sort((a, b) => a.localeCompare(b));
  cache.set("delivery-cities", cities, 10 * 60 * 1000);
  res.json(cities);
});

export const calculateDelivery = asyncHandler(async (req, res) => {
  const { city, items } = req.body;

  if (!city) {
    res.status(400);
    throw new Error("City is required.");
  }

  const origin = await getDefaultOrigin();
  const normalizedCity = normalizeTo(city);

  const zone = await DeliveryZone.findOne({
    normalizedFrom: normalizeTo(origin),
    normalizedTo: normalizedCity,
    isActive: true
  }).lean();

  if (!zone) {
    return res.json({
      available: false,
      fee: null,
      totalWeight: 0,
      message: "Delivery not available to this location."
    });
  }

  const totalWeight = (items || []).reduce(
    (sum, item) => sum + (item.weightKg || 0.5) * (item.quantity || 1),
    0
  );

  const fee = calcShipping(totalWeight, zone);

  const freeShippingSetting = await Setting.findOne({ key: "freeShipping" }).lean();
  const freeShipping = freeShippingSetting?.value === true;
  const subtotal = (items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  res.json({
    available: true,
    fee: freeShipping || subtotal > 25000 ? 0 : fee,
    totalWeight: Math.round(totalWeight * 100) / 100,
    firstKgCharge: zone.firstKgCharge,
    additionalKgCharge: zone.additionalKgCharge,
    zone: { from: zone.from, to: zone.to }
  });
});
