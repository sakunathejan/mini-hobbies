import { expireSuspensions } from "./moderationService.js";

let intervalHandle = null;

export async function runExpiryProcessor() {
  try {
    const count = await expireSuspensions();
    if (count > 0) {
      console.log(`[MODERATION] Expired ${count} suspension(s).`);
    }
  } catch (err) {
    console.error("[MODERATION] Expiry processor error:", err.message);
  }
}

export function startScheduler(intervalMs = 60000) {
  if (intervalHandle) return;
  console.log(`[MODERATION] Scheduler started (interval: ${intervalMs}ms).`);
  runExpiryProcessor();
  intervalHandle = setInterval(runExpiryProcessor, intervalMs);
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[MODERATION] Scheduler stopped.");
  }
}
