import Order from "../../models/Order.js";
import { trackShipment } from "./koombiyoService.js";
import { mapKoombiyoStatus } from "./koombiyoUtils.js";
import { enqueue } from "../../utils/jobQueue.js";
import { sendOrderStatusEmail } from "../../services/emailService.js";

async function refreshTracking(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: "Order not found" };

    const delivery = order.delivery || {};
    if (!delivery.waybillId) {
      return { success: false, error: "No waybill ID on this order" };
    }

    const result = await trackShipment(delivery.waybillId);
    if (!result.success) return result;

    const previousStatus = delivery.deliveryStatus || "";
    const newStatus = mapKoombiyoStatus(result.tracking?.statusLabel || result.tracking?.status);

    const historyEntry = {
      status: newStatus,
      label: result.tracking?.status || "",
      location: result.tracking?.location || "",
      timestamp: new Date(),
      raw: result.tracking,
    };

    const updatedHistory = [...(delivery.history || [])];
    const lastEntry = updatedHistory[updatedHistory.length - 1];
    if (!lastEntry || lastEntry.status !== newStatus) {
      updatedHistory.push(historyEntry);
    }

    order.delivery = {
      ...delivery,
      deliveryStatus: newStatus,
      history: updatedHistory,
    };

    await order.save();

    if (newStatus !== previousStatus && newStatus !== "pending") {
      const label = result.tracking?.status || newStatus;
      enqueue(`koombiyo-status-${order._id}`, () =>
        sendOrderStatusEmail(order, `Delivery update: ${label}`)
      );
    }

    return {
      success: true,
      deliveryStatus: newStatus,
      history: updatedHistory,
      tracking: result.tracking,
      fullHistory: result.history,
    };
  } catch (err) {
    console.error("[KoombiyoTracking] refresh failed:", err.message);
    return { success: false, error: err.message };
  }
}

async function syncAllActiveDeliveries() {
  const orders = await Order.find({
    "delivery.shipmentCreated": true,
    "delivery.deliveryStatus": { $nin: ["delivered", "returned"] },
  });

  let updated = 0;
  let failed = 0;

  for (const order of orders) {
    const result = await refreshTracking(order._id);
    if (result.success) {
      updated++;
    } else {
      failed++;
    }
  }

  console.log(`[KoombiyoTracking] Synced ${orders.length} orders: ${updated} updated, ${failed} failed`);
  return { total: orders.length, updated, failed };
}

export { refreshTracking, syncAllActiveDeliveries };
