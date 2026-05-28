import { expireSuspensions } from "../services/moderationService.js";

let intervalId = null;

export function startExpiryProcessor(intervalMs = 60000) {
  const run = async () => {
    try {
      const count = await expireSuspensions();
      if (count > 0) {
        console.log(`[Expiry Processor] Expired ${count} suspension(s) and queued expiry emails`);
      }
    } catch (err) {
      console.error("[Expiry Processor] Error:", err.message);
    }
  };

  console.log("[Expiry Processor] Started (interval: " + intervalMs + "ms)");
  run();
  intervalId = setInterval(run, intervalMs);
}

export function stopExpiryProcessor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
