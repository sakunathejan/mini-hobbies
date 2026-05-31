import { expireSuspensions } from "../services/moderationService.js";

let intervalId = null;

export function startExpiryProcessor(intervalMs = 60000) {
  const run = async () => {
    try {
      const now = new Date().toISOString();
      console.log(`[Expiry Processor] Checking for expired suspensions at ${now}...`);
      const count = await expireSuspensions();
      console.log(`[Expiry Processor] Result: ${count} suspension(s) expired.`);
    } catch (err) {
      console.error(`[Expiry Processor] Error: ${err.message}`);
    }
  };

  console.log(`[Expiry Processor] Started (interval: ${intervalMs}ms)`);
  run();
  intervalId = setInterval(run, intervalMs);
}

export function stopExpiryProcessor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
