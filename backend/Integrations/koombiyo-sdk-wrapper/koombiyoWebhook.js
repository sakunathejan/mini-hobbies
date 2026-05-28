import crypto from "crypto";
import Order from "../../models/Order.js";
import { mapKoombiyoStatus } from "./koombiyoUtils.js";
import { enqueue } from "../../utils/jobQueue.js";
import { sendOrderStatusEmail } from "../../services/emailService.js";

function verifyWebhookSignature(req, secret) {
  if (!secret) return true;
  const signature = req.headers["x-koombiyo-signature"] || req.headers["x-webhook-signature"] || "";
  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function handleWebhook(req, res) {
  const secret = process.env.KOOMBIYO_WEBHOOK_SECRET || "";
  if (secret && !verifyWebhookSignature(req, secret)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const { waybillid, status, order_id, location, timestamp } = req.body || {};

  if (!waybillid && !order_id) {
    return res.status(400).json({ message: "Missing waybillid or order_id" });
  }

  try {
    const query = waybillid
      ? { "delivery.waybillId": String(waybillid) }
      : { orderNumber: order_id };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const delivery = order.delivery || {};
    const newStatus = mapKoombiyoStatus(status || "");
    const previousStatus = delivery.deliveryStatus || "";

    const historyEntry = {
      status: newStatus,
      label: status || "",
      location: location || "",
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source: "webhook",
    };

    const updatedHistory = [...(delivery.history || [])];
    const lastEntry = updatedHistory[updatedHistory.length - 1];

    if (!lastEntry || lastEntry.status !== newStatus || lastEntry.location !== (location || "")) {
      updatedHistory.push(historyEntry);
    }

    order.delivery = {
      ...delivery,
      deliveryStatus: newStatus || delivery.deliveryStatus,
      history: updatedHistory,
    };

    await order.save();

    if (newStatus && newStatus !== previousStatus) {
      enqueue(`webhook-email-${order._id}`, () =>
        sendOrderStatusEmail(order, `Delivery ${newStatus}: ${status || ""}`)
      );
    }

    res.json({ message: "Webhook processed", orderId: order._id });
  } catch (err) {
    console.error("[KoombiyoWebhook] Error:", err.message);
    res.status(500).json({ message: "Webhook processing failed" });
  }
}

export { handleWebhook };
