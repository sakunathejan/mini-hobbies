import Order from "../../models/Order.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import { koombiyoPost, isInitialized, buildTrackingUrl } from "./koombiyoApiClient.js";
import { ORDER_STATUS, KOOMBIYO_TO_LIFECYCLE, isTerminal, shouldSendEmail, LIFECYCLE_TO_LEGACY } from "../../constants/orderStatus.js";
import { sendStatusUpdateEmail } from "../email/email.service.js";
import { emit, EVENTS } from "../event.service.js";
import { cancelOrderByKoombioSync } from "./cancellation.service.js";
import { addTimelineEntry } from "../../helpers/orderTimeline.js";
import { logAudit } from "../audit.service.js";

const VALID_TRACKING_LABELS = new Set(["pending", "processing", "in_transit", "delivered", "returned", "cancelled", "pickup_requested"]);
const CANCELLATION_PENALTY = new Map();

function mapDeliveryLabel(label) {
  if (!label) return "pending";
  const s = label.toLowerCase();
  if (s.includes("delivered") || s.includes("client received")) return "delivered";
  if (s.includes("out for delivery") || s.includes("dispatched")) return "in_transit";
  if (s.includes("warehouse") || s.includes("destination")) return "in_transit";
  if (s.includes("collected") || s.includes("processing")) return "processing";
  if (s.includes("pickup") || s.includes("pick up")) return "pickup_requested";
  if (s.includes("cancelled") || s.includes("return")) return "cancelled";
  return "pending";
}

export async function syncSingleOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) return { success: false, error: "Order not found" };

  const waybillId = order.delivery?.waybillId;
  if (!waybillId) return { success: false, error: "No waybill ID" };

  const currentStatus = order.lifecycleStatus || ORDER_STATUS.PENDING;
  if (isTerminal(currentStatus)) return { success: false, synced: false, reason: "Terminal status" };

  let trackingData, historyData;
  try {
    const [trackingResult, historyResult] = await Promise.allSettled([
      koombiyoPost("Allorders/users", { waybillid: waybillId, offset: 0, limit: 1 }),
      koombiyoPost("Orderhistory/users", { waybillid: waybillId })
    ]);
    trackingData = trackingResult.status === "fulfilled" ? trackingResult.value : {};
    historyData = historyResult.status === "fulfilled" ? historyResult.value : [];
  } catch (err) {
    await logAudit({
      action: "SYNC_FAILED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { error: `API call failed: ${err.message}`, waybillId }
    });
    return { success: false, error: `API call failed: ${err.message}` };
  }

  const orderData = Array.isArray(trackingData?.cust_orders) ? trackingData.cust_orders[0] : trackingData;
  const foundInKoombiyo = orderData && Object.keys(orderData).length > 0;

  if (!foundInKoombiyo) {
    const key = String(order._id);
    const prev = CANCELLATION_PENALTY.get(key) || 0;
    CANCELLATION_PENALTY.set(key, prev + 1);
    if (prev < 1) {
      console.log(`[KoombiyoSync] Deletion detected for ${order.orderNumber} (pass ${prev + 1}/2), waiting for confirmation`);
      return { success: true, synced: false, reason: "Deletion detected, awaiting second confirmation", pass: prev + 1 };
    }
    CANCELLATION_PENALTY.delete(key);
    const result = await cancelOrderByKoombioSync(order, "Waybill not found in Koombiyo (deleted from portal)");
    await logAudit({
      action: "SHIPMENT_CANCELLED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { reason: "2-pass confirmed deletion", waybillId }
    });
    return { success: true, synced: true, status: ORDER_STATUS.CANCELLED, cancelled: true, reason: "deleted" };
  }

  CANCELLATION_PENALTY.delete(String(order._id));

  const apiLabel = orderData?.status || trackingData?.status || "";
  const mappedStatus = mapDeliveryLabel(apiLabel);
  const newLifecycleStatus = KOOMBIYO_TO_LIFECYCLE[mappedStatus];

  if (!newLifecycleStatus) return { success: false, error: `Unknown status: ${mappedStatus}` };

  if (newLifecycleStatus === ORDER_STATUS.CANCELLED) {
    const key = String(order._id);
    const prev = CANCELLATION_PENALTY.get(key) || 0;
    CANCELLATION_PENALTY.set(key, prev + 1);
    if (prev < 1) {
      console.log(`[KoombiyoSync] Cancellation detected for ${order.orderNumber} (pass ${prev + 1}/2), waiting for confirmation`);
      return { success: true, synced: false, reason: "Cancellation detected, awaiting second confirmation", pass: prev + 1 };
    }
    CANCELLATION_PENALTY.delete(key);
    const result = await cancelOrderByKoombioSync(order, "Cancelled from Koombiyo portal");
    await logAudit({
      action: "SHIPMENT_CANCELLED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { reason: "2-pass confirmed cancellation from portal", waybillId }
    });
    return { success: true, synced: true, status: ORDER_STATUS.CANCELLED, cancelled: true };
  }

  if (newLifecycleStatus === currentStatus) {
    return { success: true, synced: false, reason: "No status change" };
  }

  const now = new Date();
  const previousStatus = currentStatus;
  order.lifecycleStatus = newLifecycleStatus;
  order.status = LIFECYCLE_TO_LEGACY[newLifecycleStatus] || order.status;
  order.lastSyncAt = now;

  if (newLifecycleStatus === ORDER_STATUS.DELIVERED) order.deliveredAt = now;
  if ([ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.SHIPPED].includes(newLifecycleStatus)) {
    if (!order.shippedAt) order.shippedAt = now;
  }

  addTimelineEntry(order, newLifecycleStatus, {
    note: `Koombiyo tracking: ${apiLabel}`,
    source: "api"
  });

  const historyEntry = {
    status: newLifecycleStatus,
    label: apiLabel,
    location: orderData?.location || "",
    timestamp: now,
    source: "api",
    raw: orderData
  };

  if (order.delivery) {
    order.delivery.deliveryStatus = mappedStatus;
    order.delivery.lastTrackingSyncAt = now;
    if (order.delivery.history) {
      const last = order.delivery.history[order.delivery.history.length - 1];
      if (!last || last.status !== newLifecycleStatus) {
        order.delivery.history.push(historyEntry);
      }
    }
  }

  if (order.statusHistory) {
    const last = order.statusHistory[order.statusHistory.length - 1];
    if (!last || last.status !== newLifecycleStatus) {
      order.statusHistory.push({
        status: newLifecycleStatus,
        note: `Koombiyo tracking: ${apiLabel}`,
        updatedAt: now
      });
    }
  }

  await order.save({ validateModifiedOnly: true });

  try {
    const shipmentHistoryEntry = { status: mappedStatus, label: apiLabel, location: orderData?.location || "", timestamp: now, source: "api", raw: orderData };
    await KoombiyoShipment.findOneAndUpdate(
      { order: orderId },
      { $set: { deliveryStatus: mappedStatus, lastTrackingSyncAt: now }, $push: { history: shipmentHistoryEntry } }
    );
  } catch (err) {
    console.error("[Sync] KoombiyoShipment update error:", err.message);
  }

  await logAudit({
    action: "STATUS_CHANGED",
    orderId: order._id,
    orderNumber: order.orderNumber,
    details: { from: previousStatus, to: newLifecycleStatus, waybillId, label: apiLabel }
  });

  if (shouldSendEmail(previousStatus, newLifecycleStatus)) {
    emit(EVENTS.ORDER_STATUS_UPDATED, { order, previousStatus, newStatus: newLifecycleStatus, data: orderData });
    const emailResult = await sendStatusUpdateEmail(order, newLifecycleStatus, {
      waybillId,
      location: orderData?.location || "",
      note: apiLabel
    });
    if (!emailResult.success) {
      console.error(`[Sync] Status update email failed for ${order.orderNumber}:`, emailResult.error);
    }
    if (newLifecycleStatus === ORDER_STATUS.DELIVERED) {
      emit(EVENTS.ORDER_DELIVERED, { order, data: orderData });
    }
  }

  return { success: true, synced: true, previousStatus, newStatus: newLifecycleStatus };
}

export async function syncAllActiveDeliveries() {
  if (!isInitialized()) {
    console.warn("[KoombiyoSync] Not initialized");
    return { total: 0, synced: 0, failed: 0, errors: [] };
  }

  const orders = await Order.find({
    "delivery.shipmentCreated": true,
    lifecycleStatus: { $nin: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED] }
  }).select("_id orderNumber lifecycleStatus delivery.waybillId");

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (const order of orders) {
    try {
      const result = await syncSingleOrder(order._id);
      if (result.synced) synced++;
      else if (result.error) { failed++; errors.push({ order: order.orderNumber, error: result.error }); }
    } catch (err) {
      failed++;
      errors.push({ order: order.orderNumber, error: err.message });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[KoombiyoSync] Synced ${orders.length} orders: ${synced} updated, ${failed} failed`);
  return { total: orders.length, synced, failed, errors };
}

export async function detectKoombiyoCancellations() {
  if (!isInitialized()) return { total: 0, cancelled: 0 };

  const orders = await Order.find({
    "delivery.shipmentCreated": true,
    lifecycleStatus: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED] }
  }).select("_id orderNumber lifecycleStatus delivery.waybillId");

  let cancelled = 0;

  for (const order of orders) {
    if (!order.delivery?.waybillId) continue;
    try {
      const trackingData = await koombiyoPost("Allorders/users", {
        waybillid: order.delivery.waybillId,
        offset: 0,
        limit: 1
      });
      const orderData = Array.isArray(trackingData?.cust_orders) ? trackingData.cust_orders[0] : trackingData;
      const foundInKoombiyo = orderData && Object.keys(orderData).length > 0;

      if (!foundInKoombiyo && order.lifecycleStatus !== ORDER_STATUS.CANCELLED) {
        const key = String(order._id);
        const prev = CANCELLATION_PENALTY.get(key) || 0;
        CANCELLATION_PENALTY.set(key, prev + 1);
        if (prev >= 1) {
          CANCELLATION_PENALTY.delete(key);
          const fullOrder = await Order.findById(order._id);
          await cancelOrderByKoombioSync(fullOrder, "Waybill not found in Koombiyo (deleted from portal)");
          cancelled++;
        }
        continue;
      }

      const apiLabel = orderData?.status || trackingData?.status || "";
      const mappedStatus = mapDeliveryLabel(apiLabel);

      if (mappedStatus === "cancelled" && order.lifecycleStatus !== ORDER_STATUS.CANCELLED) {
        const key = String(order._id);
        const prev = CANCELLATION_PENALTY.get(key) || 0;
        CANCELLATION_PENALTY.set(key, prev + 1);
        if (prev >= 1) {
          CANCELLATION_PENALTY.delete(key);
          const fullOrder = await Order.findById(order._id);
          await cancelOrderByKoombioSync(fullOrder, "Cancelled from Koombiyo portal");
          cancelled++;
        }
      }
    } catch (err) {
      continue;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (cancelled > 0) {
    console.log(`[KoombiyoSync] Detected ${cancelled} external cancellations`);
  }
  return { total: orders.length, cancelled };
}
