import KoombiyoDistrict from "../../models/koombiyo/KoombiyoDistrict.js";
import { koombiyoPost, isInitialized } from "./koombiyoApiClient.js";
import * as cache from "../../utils/cache.js";

const CACHE_KEY = "koombiyo:districts";
const CACHE_TTL = 30 * 60 * 1000;

function extractDistrictName(d) {
  return String(d.name || d.district || d.district_name || d.title || "").trim();
}

export async function syncDistricts() {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized", districts: [] };

  try {
    const raw = await koombiyoPost("Districts/users");
    const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);

    const ops = list.map((d) => {
      const name = extractDistrictName(d);
      return {
        updateOne: {
          filter: { districtId: Number(d.id || d.district_id) },
          update: {
            $set: {
              name,
              normalizedName: name.toLowerCase(),
              lastSyncedAt: new Date(),
              isActive: true
            },
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) await KoombiyoDistrict.bulkWrite(ops, { ordered: false });
    cache.clear(CACHE_KEY);

    const districts = await KoombiyoDistrict.find({ isActive: true }).sort("name").lean();
    return { success: true, districts, count: districts.length };
  } catch (err) {
    console.error("[Koombiyo] syncDistricts error:", err.message);
    return { success: false, error: err.message, districts: [] };
  }
}

export async function getDistricts() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const districts = await KoombiyoDistrict.find({ isActive: true }).sort("name").lean();
  cache.set(CACHE_KEY, districts, CACHE_TTL);
  return districts;
}

export async function getDistrictByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return KoombiyoDistrict.findOne({ normalizedName: n, isActive: true }).lean();
}

export async function getDistrictById(id) {
  return KoombiyoDistrict.findOne({ districtId: Number(id) }).lean();
}
