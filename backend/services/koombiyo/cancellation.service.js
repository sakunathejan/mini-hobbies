import Order from "../../models/Order.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import { ORDER_STATUS, isTerminal, isValidTransition, LIFECYCLE_TO_LEGACY } from "../../constants/orderStatus.js";
import { emit, EVENTS } from "../event.service.js";
import { sendOrderCancellationEmail } from "../email/email.service.js";

export async function cancelOrder(orderId, { reason, cancelledBy } = {}) {
  const order = await Order.findById(orderId);
  if (!order) return { success: false, error: "Order not found" };

  const currentStatus = order.lifecycleStatus || ORDER_STATUS.PENDING;
  if (isTerminal(currentStatus)) {
    return { success: false, error: `Cannot cancel order in ${currentStatus} status` };
  }

  if (!isValidTransition(currentStatus, ORDER_STATUS.CANCELLED)) {
    return { success: false, error: `Cannot transition from ${currentStatus} to CANCELLED` };
  }

  const now = new Date();

  order.lifecycleStatus = ORDER_STATUS.CANCELLED;
  order.cancellationReason = reason || "";
  order.cancelledAt = now;
  order.status = LIFECYCLE_TO_LEGACY[ORDER_STATUS.CANCELLED];
  order.lastSyncAt = now;

  if (order.delivery?.shipmentCreated) {
    order.delivery.deliveryStatus = "cancelled";
    if (order.delivery.history) {
      order.delivery.history.push({
        status: "cancelled",
        label: "Order cancelled via website",
        location: "",
        timestamp: now,
        source: "manual"
      });
    }
  }

  if (order.statusHistory) {
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: reason || "Cancelled by " + (cancelledBy || "admin"),
      updatedAt: now
    });
  }

  await order.save({ validateModifiedOnly: true });

  if (order.delivery?.shipmentId) {
    await KoombiyoShipment.findByIdAndUpdate(order.delivery.shipmentId, {
      $set: {
        cancelledAt: now,
        cancelReason: reason || "",
        deliveryStatus: "cancelled"
      },
      $push: {
        history: {
          status: "cancelled",
          label: "Order cancelled via website",
          timestamp: now,
          source: "manual"
        }
      }
    });
  }

  emit(EVENTS.ORDER_CANCELLED, { order, reason, cancelledBy });

  const emailResult = await sendOrderCancellationEmail(order, reason);
  if (!emailResult.success) {
    console.error("[Cancellation] Email failed:", emailResult.error);
  }

  return { success: true, order };
}

export async function cancelOrderByKoombioSync(order, reason) {
  const now = new Date();
  order.lifecycleStatus = ORDER_STATUS.CANCELLED;
  order.cancellationReason = reason || "Cancelled via Koombiyo portal";
  order.cancelledAt = now;
  order.status = LIFECYCLE_TO_LEGACY[ORDER_STATUS.CANCELLED];
  order.lastSyncAt = now;

  if (order.delivery?.history) {
    order.delivery.history.push({
      status: "cancelled",
      label: reason || "Cancelled/deleted from Koombiyo portal",
      location: "",
      timestamp: now,
      source: "api"
    });
  }

  if (order.statusHistory) {
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: reason || "Cancelled/deleted from Koombiyo portal",
      updatedAt: now
    });
  }

  await order.save({ validateModifiedOnly: true });

  const emailResult = await sendOrderCancellationEmail(order, reason);
  if (!emailResult.success) {
    console.error("[Cancellation Sync] Email failed:", emailResult.error);
  }

  return { success: true, order };
}
