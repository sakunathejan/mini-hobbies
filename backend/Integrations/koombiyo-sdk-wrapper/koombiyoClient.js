import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);

const sdkPath = path.resolve(__dirname, "..", "..", "Integrations", "koombiyo-sdk", "build", "index.js");
const { Koombiyo, Types } = require(sdkPath);

let initialized = false;

export function initKoombiyo(apiKey) {
  if (initialized) return;
  if (!apiKey) {
    console.warn("[Koombiyo] No API key provided — skipping init");
    return;
  }
  Koombiyo.init(apiKey, process.env.KOOMBIYO_DEBUG === "true");
  initialized = true;
  console.log("[Koombiyo] SDK initialized");
}

export { Koombiyo, Types };
export function isInitialized() {
  return initialized;
}
