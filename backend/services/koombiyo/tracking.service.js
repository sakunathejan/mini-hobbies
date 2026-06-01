import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import KoombiyoWaybill from "../../models/koombiyo/KoombiyoWaybill.js";
import Order from "../../models/Order.js";
import { koombiyoPost, isInitialized } from "./koombiyoApiClient.js";
import * as cache from "../../utils/cache.js";
import { ORDER_STATUS, KOOMBIYO_TO_LIFECYCLE, shouldSendEmail, LIFECYCLE_TO_LEGACY } from "../../constants/orderStatus.js";
import { emit, EVENTS } from "../event.service.js";
import { sendStatusUpdateEmail } from "../email/email.service.js";
import { addTimelineEntry } from "../../helpers/orderTimeline.js";
import { logAudit } from "../audit.service.js";

function mapDeliveryStatus(label) {
  if (!label) return "pending";
  const s = label.toLowerCase();
  if (s.includes("delivered") || s.includes("client received")) return "delivered";
  if (s.includes("out for delivery") || s.includes("dispatched")) return "in_transit";
  if (s.includes("warehouse") || s.includes("destination")) return "in_transit";
  if (s.includes("collected") || s.includes("processing")) return "processing";
  if (s.includes("pickup") || s.includes("pick up")) return "pickup_requested";
  if (s.includes("cancelled") || s.includes("return")) return "returned";
  return "pending";
}

export async function refreshTracking(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: "Order not found" };

    const delivery = order.delivery || {};
    const waybillId = delivery.waybillId;
    if (!waybillId) return { success: false, error: "No waybill ID" };

    const currentLifecycleStatus = order.lifecycleStatus || ORDER_STATUS.PENDING;
    if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED].includes(currentLifecycleStatus)) {
      return { success: true, synced: false, reason: "Terminal status" };
    }

    const [trackingResult, historyResult] = await Promise.allSettled([
      koombiyoPost("Allorders/users", { waybillid: waybillId, offset: 0, limit: 1 }),
      koombiyoPost("Orderhistory/users", { waybillid: waybillId })
    ]);

    const trackingRaw = trackingResult.status === "fulfilled" ? trackingResult.value : {};
    const historyRaw = historyResult.status === "fulfilled" ? historyResult.value : [];

    const orderData = Array.isArray(trackingRaw?.cust_orders) ? trackingRaw.cust_orders[0] : trackingRaw;
    const statusLabel = orderData?.status || trackingRaw?.status || "";
    const mappedStatus = mapDeliveryStatus(statusLabel);
    const newLifecycleStatus = KOOMBIYO_TO_LIFECYCLE[mappedStatus] || currentLifecycleStatus;

    const historyEntries = Array.isArray(historyRaw)
      ? historyRaw.map((h) => ({
          status: mapDeliveryStatus(h.status),
          label: h.status || "",
          location: h.location || "",
          note: h.remark || h.note || "",
          date: h.date || h.created_at || ""
        }))
      : [];

    const previousStatus = delivery.deliveryStatus || "";

    const historyEntry = {
      status: mappedStatus,
      label: statusLabel,
      location: orderData?.location || "",
      timestamp: new Date(),
      source: "api",
      raw: orderData
    };

    const updatedHistory = [...(delivery.history || [])];
    const last = updatedHistory[updatedHistory.length - 1];
    if (!last || last.status !== mappedStatus) {
      updatedHistory.push(historyEntry);
    }

    await KoombiyoShipment.findOneAndUpdate(
      { order: orderId },
      {
        $set: { deliveryStatus: mappedStatus, lastTrackingSyncAt: new Date() },
        $push: { history: historyEntry }
      }
    );

    order.delivery = {
      ...delivery,
      deliveryStatus: mappedStatus,
      history: updatedHistory,
      lastTrackingSyncAt: new Date()
    };

    if (newLifecycleStatus !== currentLifecycleStatus) {
      order.lifecycleStatus = newLifecycleStatus;
      order.status = LIFECYCLE_TO_LEGACY[newLifecycleStatus] || order.status;
      order.lastSyncAt = new Date();

      if (newLifecycleStatus === ORDER_STATUS.DELIVERED) order.deliveredAt = new Date();
      if ([ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.SHIPPED].includes(newLifecycleStatus) && !order.shippedAt) {
        order.shippedAt = new Date();
      }

      addTimelineEntry(order, newLifecycleStatus, {
        note: `Koombiyo tracking: ${statusLabel}`,
        source: "api"
      });

      if (order.statusHistory) {
        order.statusHistory.push({
          status: newLifecycleStatus,
          note: `Koombiyo tracking: ${statusLabel}`,
          updatedAt: new Date()
        });
      }

      await logAudit({
        action: "STATUS_CHANGED",
        orderId: order._id,
        orderNumber: order.orderNumber,
        details: { from: currentLifecycleStatus, to: newLifecycleStatus, waybillId, label: statusLabel }
      });
    }

    await order.save({ validateModifiedOnly: true });

    await KoombiyoWaybill.findOneAndUpdate(
      { waybillId },
      {
        $set: {
          status: statusLabel,
          currentLocation: orderData?.location || "",
          lastUpdate: orderData?.last_update || "",
          estimatedDelivery: orderData?.delivery_date || "",
          lastSyncedAt: new Date()
        }
      },
      { upsert: true }
    );

    cache.clear(`koombiyo:tracking:${orderId}`);

    if (newLifecycleStatus !== currentLifecycleStatus && shouldSendEmail(currentLifecycleStatus, newLifecycleStatus)) {
      emit(EVENTS.ORDER_STATUS_UPDATED, { order, previousStatus: currentLifecycleStatus, newStatus: newLifecycleStatus, data: orderData });
      sendStatusUpdateEmail(order, newLifecycleStatus, { waybillId, location: orderData?.location || "", note: statusLabel }).catch(err => {
        console.error("[Koombiyo] Status update email failed:", err.message);
      });
      if (newLifecycleStatus === ORDER_STATUS.DELIVERED) {
        emit(EVENTS.ORDER_DELIVERED, { order, data: orderData });
      }
    }

    return {
      success: true,
      deliveryStatus: mappedStatus,
      history: updatedHistory,
      tracking: {
        status: mappedStatus,
        statusLabel,
        location: orderData?.location || "",
        estimatedDelivery: orderData?.delivery_date || "",
        lastUpdate: orderData?.last_update || ""
      },
      fullHistory: historyEntries,
      lifecycleStatus: newLifecycleStatus
    };
  } catch (err) {
    console.error("[Koombiyo] refreshTracking error:", err.message);
    return { success: false, error: err.message };
  }
}

export async function syncAllActiveDeliveries() {
  const orders = await Order.find({
    "delivery.shipmentCreated": true,
    lifecycleStatus: { $nin: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED] }
  });

  let updated = 0;
  let failed = 0;

  for (const order of orders) {
    const result = await refreshTracking(order._id);
    if (result.success) updated++;
    else failed++;
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[Koombiyo] Synced ${orders.length} orders: ${updated} updated, ${failed} failed`);
  return { total: orders.length, updated, failed };
}

export async function getShipmentByOrder(orderId) {
  return KoombiyoShipment.findOne({ order: orderId }).lean();
}
