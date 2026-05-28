const DISTRICT_MAP = {
  "ampara": 1, "anuradhapura": 2, "badulla": 3, "batticaloa": 4, "colombo": 5,
  "galle": 6, "gampaha": 7, "hambantota": 8, "jaffna": 9, "kalutara": 10,
  "kandy": 11, "kegalle": 12, "kilinochchi": 13, "kurunegala": 14, "mannar": 15,
  "matale": 16, "matara": 17, "monaragala": 18, "mullaitivu": 19, "nuwara eliya": 20,
  "polonnaruwa": 21, "puttalam": 22, "ratnapura": 23, "trincomalee": 24, "vavuniya": 25,
};

const VALID_DISTRICTS = new Set(Object.keys(DISTRICT_MAP));

const CITY_MAP = {
  "colombo": 5, "colombo 1": 12, "colombo 2": 19, "colombo 3": 20,
  "colombo 4": 21, "colombo 5": 22, "colombo 6": 23, "colombo 7": 24,
  "colombo 8": 25, "colombo 9": 26, "colombo 10": 13, "colombo 11": 14,
  "colombo 12": 15, "colombo 13": 16, "colombo 14": 17, "colombo 15": 18,
  "kandy": 11, "galle": 4906, "jaffna": 1956, "negombo": 2064,
  "gampaha": 1926, "kurunegala": 14, "batticaloa": 575, "matara": 17,
  "anuradhapura": 831, "badulla": 1877, "ratnapura": 23, "kalutara": 10,
  "trincomalee": 24, "matale": 16, "kegalle": 1980, "puttalam": 22,
  "vavuniya": 4498, "polonnaruwa": 21, "hambantota": 1937,
  "ampara": 1867, "mannar": 15, "monaragala": 18, "kilinochchi": 13,
  "mullaitivu": 19, "nuwara eliya": 20,
};

export function mapDistrict(district) {
  if (!district) return null;
  const key = district.trim().toLowerCase();
  return DISTRICT_MAP[key] || null;
}

export function mapCity(city) {
  if (!city) return null;
  const key = city.trim().toLowerCase();
  return CITY_MAP[key] || null;
}

export function isValidDistrict(district) {
  if (!district) return false;
  return VALID_DISTRICTS.has(district.trim().toLowerCase());
}

export function validateAddress(address) {
  const errors = [];
  if (!address.name) errors.push("Recipient name is required");
  if (!address.phone) errors.push("Phone number is required");
  if (!address.address) errors.push("Address line is required");
  if (address.district && address.district.trim() && !isValidDistrict(address.district)) {
    errors.push(`Invalid district: "${address.district}"`);
  }
  return errors;
}

export function defaultCityForDistrict(district) {
  if (!district) return null;
  const d = district.trim().toLowerCase();
  const cityKey = Object.keys(CITY_MAP).find((k) => k === d || k.startsWith(d));
  return cityKey ? CITY_MAP[cityKey] : mapDistrict(d);
}
