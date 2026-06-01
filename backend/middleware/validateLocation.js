import KoombiyoDistrict from "../models/koombiyo/KoombiyoDistrict.js";
import KoombiyoCity from "../models/koombiyo/KoombiyoCity.js";

export async function validateDistrictExists(districtId) {
  if (!districtId && districtId !== 0) {
    return { valid: false, error: "District ID is required" };
  }
  const district = await KoombiyoDistrict.findOne({ districtId: Number(districtId), isActive: true }).lean();
  if (!district) {
    return { valid: false, error: `District with ID ${districtId} not found` };
  }
  return { valid: true, district };
}

export async function validateCityInDistrict(cityId, districtId) {
  if (!cityId && cityId !== 0) {
    return { valid: false, error: "City ID is required" };
  }
  if (!districtId && districtId !== 0) {
    return { valid: false, error: "District ID is required to validate city" };
  }
  const city = await KoombiyoCity.findOne({ cityId: Number(cityId), districtId: Number(districtId), isActive: true }).lean();
  if (!city) {
    return { valid: false, error: `City ID ${cityId} not found in district ID ${districtId}` };
  }
  return { valid: true, city };
}

export function validateSriLankanPhone(phone) {
  if (!phone) return { valid: false, error: "Phone number is required" };
  const cleaned = phone.replace(/\D/g, "");
  const isValid = /^(?:\+94|0)?[1-9]\d{8}$/.test(cleaned) || /^(?:\+94|0)?7[0-9]{8}$/.test(cleaned);
  if (!isValid) {
    return { valid: false, error: "Invalid Sri Lankan phone number" };
  }
  return { valid: true, phone: cleaned };
}
