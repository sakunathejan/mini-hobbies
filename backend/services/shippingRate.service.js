import DeliveryZone from "../../models/DeliveryZone.js";
import Setting from "../../models/Setting.js";
import * as cache from "../../utils/cache.js";

const CACHE_KEY_RATES = "shipping:rates";
const CACHE_TTL = 15 * 60 * 1000;

export async function calculateShippingFee(from, to, weightKg = 1) {
  if (!from || !to) return { fee: 0, source: "invalid" };

  const freeShipping = await isFreeShipping();
  if (freeShipping) return { fee: 0, source: "free_shipping" };

  const w = Math.max(0.1, Number(weightKg) || 1);

  const normalizedFrom = from.trim().toLowerCase();
  const normalizedTo = to.trim().toLowerCase();

  const zone = await DeliveryZone.findOne({
    normalizedFrom,
    normalizedTo,
    isActive: true
  }).lean();

  if (zone) {
    let fee = zone.firstKgCharge;
    if (w > 1) {
      fee += Math.ceil(w - 1) * zone.additionalKgCharge;
    }
    return { fee, source: "database", zone };
  }

  const reverseZone = await DeliveryZone.findOne({
    normalizedFrom: normalizedTo,
    normalizedTo: normalizedFrom,
    isActive: true
  }).lean();

  if (reverseZone) {
    let fee = reverseZone.firstKgCharge;
    if (w > 1) {
      fee += Math.ceil(w - 1) * reverseZone.additionalKgCharge;
    }
    return { fee, source: "database_reverse", zone: reverseZone };
  }

  return { fee: 350, source: "fallback_default" };
}

export async function getAllShippingRates() {
  const cached = cache.get(CACHE_KEY_RATES);
  if (cached) return cached;

  const rates = await DeliveryZone.find({ isActive: true }).sort("from to").lean();
  cache.set(CACHE_KEY_RATES, rates, CACHE_TTL);
  return rates;
}

export async function getDistinctOrigins() {
  return DeliveryZone.distinct("normalizedFrom", { isActive: true });
}

async function isFreeShipping() {
  try {
    const setting = await Setting.findOne({ key: "freeShipping" });
    return setting?.value === true || setting?.value === "true";
  } catch {
    return false;
  }
}
