import { syncAllActiveDeliveries, detectKoombiyoCancellations } from "./sync.service.js";

const INTERVAL_MS = 5 * 60 * 1000;
let intervalHandle = null;

export function startSyncScheduler() {
  if (intervalHandle) return;
  console.log(`[KoombiyoSync] Scheduler started (interval: ${INTERVAL_MS / 1000}s)`);
  runSyncCycle();
  intervalHandle = setInterval(runSyncCycle, INTERVAL_MS);
}

export function stopSyncScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[KoombiyoSync] Scheduler stopped");
  }
}

async function runSyncCycle() {
  try {
    const [syncResult, cancelResult] = await Promise.allSettled([
      syncAllActiveDeliveries(),
      detectKoombiyoCancellations()
    ]);
    if (syncResult.status === "fulfilled") {
      const r = syncResult.value;
      if (r.synced > 0 || r.failed > 0) {
        console.log(`[KoombiyoSync] Cycle: ${r.synced} updated, ${r.failed} failed out of ${r.total}`);
      }
    }
    if (cancelResult.status === "fulfilled") {
      const r = cancelResult.value;
      if (r.cancelled > 0) {
        console.log(`[KoombiyoSync] External cancellations detected: ${r.cancelled}`);
      }
    }
  } catch (err) {
    console.error("[KoombiyoSync] Cycle error:", err.message);
  }
}
