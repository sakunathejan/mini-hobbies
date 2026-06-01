import KoombiyoCity from "../../models/koombiyo/KoombiyoCity.js";
import KoombiyoDistrict from "../../models/koombiyo/KoombiyoDistrict.js";
import { koombiyoPost, isInitialized } from "./koombiyoApiClient.js";
import * as cache from "../../utils/cache.js";

function citiesCacheKey(districtId) {
  return `koombiyo:cities:${districtId}`;
}

function extractCityName(c) {
  return String(c.name || c.city || c.city_name || c.town || "").trim();
}

export async function syncCities(districtId) {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized", cities: [] };

  try {
    const raw = await koombiyoPost("Cities/users", { district_id: districtId });
    const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);

    const district = await KoombiyoDistrict.findOne({ districtId: Number(districtId) }).lean();
    const districtName = district?.name || "";

    const ops = list.map((c) => {
      const name = extractCityName(c);
      return {
        updateOne: {
          filter: { cityId: Number(c.id || c.city_id), districtId: Number(districtId) },
          update: {
            $set: {
              name,
              normalizedName: name.toLowerCase(),
              districtName,
              lastSyncedAt: new Date(),
              isActive: true
            },
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) await KoombiyoCity.bulkWrite(ops, { ordered: false });
    cache.clear(citiesCacheKey(districtId));

    const cities = await KoombiyoCity.find({ districtId: Number(districtId), isActive: true }).sort("name").lean();
    return { success: true, cities, count: cities.length };
  } catch (err) {
    console.error(`[Koombiyo] syncCities(${districtId}) error:`, err.message);
    return { success: false, error: err.message, cities: [] };
  }
}

export async function getCities(districtId) {
  const key = citiesCacheKey(districtId);
  const cached = cache.get(key);
  if (cached) return cached;

  const cities = await KoombiyoCity.find({ districtId: Number(districtId), isActive: true }).sort("name").lean();
  cache.set(key, cities, 30 * 60 * 1000);
  return cities;
}

export async function getAllCities() {
  const cached = cache.get("koombiyo:cities:all");
  if (cached) return cached;

  const cities = await KoombiyoCity.find({ isActive: true }).sort("districtId name").lean();
  cache.set("koombiyo:cities:all", cities, 30 * 60 * 1000);
  return cities;
}

export async function getCityById(cityId) {
  if (cityId === undefined || cityId === null) return null;
  return KoombiyoCity.findOne({ cityId: Number(cityId), isActive: true }).lean();
}

export async function getCityByName(name, districtId) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const filter = { normalizedName: n };
  if (districtId) filter.districtId = Number(districtId);
  return KoombiyoCity.findOne(filter).lean();
}
