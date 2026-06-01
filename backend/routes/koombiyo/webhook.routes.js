import crypto from "crypto";
import { Router } from "express";
import Order from "../../models/Order.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { enqueue } from "../../utils/jobQueue.js";
import { sendOrderStatusEmail } from "../../services/emailService.js";

const router = Router();

function verifySignature(req, secret) {
  if (!secret) return true;
  const signature = req.headers["x-koombiyo-signature"] || req.headers["x-webhook-signature"] || "";
  if (!signature) return false;
  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function mapStatus(status) {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s.includes("delivered") || s.includes("client received")) return "delivered";
  if (s.includes("out for delivery") || s.includes("dispatched")) return "in_transit";
  if (s.includes("warehouse") || s.includes("destination")) return "in_transit";
  if (s.includes("collected") || s.includes("processing")) return "processing";
  if (s.includes("cancelled") || s.includes("return")) return "returned";
  return "pending";
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const secret = process.env.KOOMBIYO_WEBHOOK_SECRET || "";
    if (secret && !verifySignature(req, secret)) {
      res.status(401).json({ message: "Invalid signature" });
      return;
    }

    const { waybillid, status, order_id, location, timestamp } = req.body || {};
    if (!waybillid && !order_id) {
      res.status(400).json({ message: "Missing waybillid or order_id" });
      return;
    }

    const query = waybillid
      ? { "delivery.waybillId": String(waybillid) }
      : { orderNumber: order_id };

    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const delivery = order.delivery || {};
    const newStatus = mapStatus(status || "");
    const previousStatus = delivery.deliveryStatus || "";

    const historyEntry = {
      status: newStatus,
      label: status || "",
      location: location || "",
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source: "webhook"
    };

    const updatedHistory = [...(delivery.history || [])];
    const lastEntry = updatedHistory[updatedHistory.length - 1];
    if (!lastEntry || lastEntry.status !== newStatus || lastEntry.location !== (location || "")) {
      updatedHistory.push(historyEntry);
    }

    order.delivery = {
      ...delivery,
      deliveryStatus: newStatus || delivery.deliveryStatus,
      history: updatedHistory
    };
    await order.save();

    await KoombiyoShipment.findOneAndUpdate(
      { order: order._id },
      {
        $set: { deliveryStatus: newStatus || delivery.deliveryStatus, lastTrackingSyncAt: new Date() },
        $push: { history: historyEntry }
      }
    );

    if (newStatus && newStatus !== previousStatus) {
      enqueue(`webhook-email-${order._id}`, () =>
        sendOrderStatusEmail(order, `Delivery ${newStatus}: ${status || ""}`)
      );
    }

    res.json({ message: "Webhook processed", orderId: order._id });
  })
);

export default router;
