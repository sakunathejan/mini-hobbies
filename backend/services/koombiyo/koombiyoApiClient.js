import axios from "axios";
import https from "https";

const API_HOST = "https://application.koombiyodelivery.lk/api";
let _apiKey = "";
let _initialized = false;

function getAgent() {
  return new https.Agent({ keepAlive: false });
}

export function initKoombiyo(apiKey) {
  if (_initialized) return;
  if (!apiKey) {
    console.warn("[Koombiyo] No API key provided");
    return;
  }
  _apiKey = apiKey.trim();
  _initialized = true;
  console.log("[Koombiyo] Client initialized");
}

export function isInitialized() {
  return _initialized;
}

function buildForm(body = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  params.append("apikey", _apiKey);
  return params;
}

export async function koombiyoPost(endpoint, body = {}) {
  if (!_initialized) throw new Error("Koombiyo client not initialized");
  const form = buildForm(body);
  const bodyStr = form.toString();
  const url = `${API_HOST}/${endpoint}`;
  console.log(`[Koombiyo] POST ${url}`);
  console.log(`[Koombiyo] Headers: Content-Type=application/x-www-form-urlencoded`);
  console.log(`[Koombiyo] Body: ${bodyStr.substring(0, 500)}`);
  const response = await axios.post(url, form, {
    timeout: 30000,
    httpsAgent: getAgent(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://application.koombiyodelivery.lk",
      "Referer": "https://application.koombiyodelivery.lk/"
    }
  });
  return response.data;
}

export async function koombiyoPostRaw(endpoint, body = {}) {
  if (!_initialized) throw new Error("Koombiyo client not initialized");
  const form = buildForm(body);
  const response = await axios.post(`${API_HOST}/${endpoint}`, form, {
    timeout: 60000,
    httpsAgent: getAgent(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://application.koombiyodelivery.lk",
      "Referer": "https://application.koombiyodelivery.lk/"
    }
  });
  return response.data;
}

export function buildTrackingUrl(waybillId, phone) {
  if (!waybillId) return "";
  const p = String(phone || "").replace(/\D/g, "").replace(/^0/, "94");
  return `https://application.koombiyodelivery.lk/track?waybillid=${waybillId}&phone=${p}`;
}

export default { initKoombiyo, isInitialized, koombiyoPost, koombiyoPostRaw, buildTrackingUrl };
