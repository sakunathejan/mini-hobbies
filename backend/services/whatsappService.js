import Order from "../models/Order.js";
import { normalizePhone } from "../utils/whatsapp.js";

const formatStatusMessage = (order, note) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const methodLabels = { bank_transfer: "Bank Transfer", cod: "Cash on Delivery", advance: "50% Advance" };
  const lines = [
    "Mini Hobbies - Order Update",
    "",
    "Hello " + (order.customer?.name || "Valued Customer") + ",",
    "Your order status has been updated.",
    "",
    "Order: " + order.orderNumber,
    "Status: " + order.status,
    "",
    "Payment: " + (methodLabels[order.paymentMethod] || order.paymentMethod || "N/A"),
  ];
  if (order.remainingBalance > 0) {
    lines.push("Remaining Balance: LKR " + Number(order.remainingBalance).toLocaleString("en-LK"));
  }
  if (order.trackingNumber) {
    lines.push("Tracking: " + order.trackingNumber);
  }
  if (note) {
    lines.push("Note: " + note);
  }
  lines.push("");
  lines.push("Track your order: " + clientUrl + "/track-order?order=" + order.orderNumber + "&phone=" + encodeURIComponent(order.customer?.phone || ""));
  lines.push("");
  lines.push("Thank you for shopping with Mini Hobbies!");
  return lines.join("\n");
};

export const retryCustomerWhatsApp = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  const lastStatusEntry = order.statusHistory?.[order.statusHistory.length - 1];
  const message = formatStatusMessage(order, lastStatusEntry?.note || "");
  const digits = normalizePhone(order.customer?.phone || "");
  const intl = digits.startsWith("94") ? digits : "94" + digits.replace(/^0/, "");
  if (!intl) throw new Error("Customer phone not available");
  return { whatsappUrl: "https://wa.me/" + intl + "?text=" + encodeURIComponent(message) };
};

export const buildCustomerWhatsAppUrl = (order, note) => {
  const message = formatStatusMessage(order, note);
  const digits = normalizePhone(order.customer?.phone || "");
  const intl = digits.startsWith("94") ? digits : "94" + digits.replace(/^0/, "");
  if (!intl) return "";
  return "https://wa.me/" + intl + "?text=" + encodeURIComponent(message);
};