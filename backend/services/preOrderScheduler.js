import Product from "../models/Product.js";
import { transitionPreOrder } from "./preOrderStateMachine.js";

let intervalHandle = null;
let running = false;

const closeExpiredPreOrders = async () => {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const expired = await Product.find({
      productType: "PRE_ORDER",
      preOrderStatus: "PRE_ORDER_ACTIVE",
      preOrderDeadline: { $lte: now }
    }).limit(100).lean();

    if (expired.length === 0) {
      console.log(`[PRE-ORDER CRON] No expired pre-orders found.`);
      return;
    }

    console.log(`[PRE-ORDER CRON] Closing ${expired.length} expired pre-order(s)...`);
    for (const product of expired) {
      try {
        await transitionPreOrder(product._id, "PRE_ORDER_CLOSED", {
          trigger: "cron",
          note: "Auto-closed by scheduler — deadline passed"
        });
      } catch (err) {
        console.error(`[PRE-ORDER CRON] Failed to close ${product.name} (${product._id}): ${err.message}`);
      }
    }
    console.log(`[PRE-ORDER CRON] Done.`);
  } catch (err) {
    console.error("[PRE-ORDER CRON] Error:", err.message);
  } finally {
    running = false;
  }
};

export const startPreOrderScheduler = (intervalMs = 6 * 60 * 60 * 1000) => {
  if (intervalHandle) return;
  console.log(`[PRE-ORDER CRON] Scheduler started (interval: ${intervalMs / 60000} min)`);
  closeExpiredPreOrders();
  intervalHandle = setInterval(closeExpiredPreOrders, intervalMs);
};

export const stopPreOrderScheduler = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[PRE-ORDER CRON] Scheduler stopped.");
  }
};
