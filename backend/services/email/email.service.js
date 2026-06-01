import { sendMail } from "../emailService.js";
import EmailLog from "../../models/EmailLog.js";

const ACCENT_GREEN = "#1a7a2e";
const ACCENT_RED = "#991b1b";
const ACCENT_AMBER = "#e8951a";

function buildItemsHtml(items) {
  return (items || [])
    .map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name} x${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">LKR ${(i.price * i.quantity).toLocaleString()}</td></tr>`)
    .join("");
}

function wrapHtml(title, accentColor, bodyContent) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:${accentColor};padding:24px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px">${title}</h1>
</td></tr>
<tr><td style="padding:32px">${bodyContent}</td></tr>
<tr><td style="background:#333;padding:16px;text-align:center">
<p style="margin:0;color:#aaa;font-size:12px">Mini Hobbies &bull; All Rights Reserved</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

async function sendWithDedup({ order, to, subject, eventType, html, statusLabel }) {
  if (!to) return { success: false, error: "No customer email" };
  const dup = await EmailLog.findOne({
    order: order._id,
    eventType,
    status: "sent"
  });
  if (dup) return { success: false, error: "Duplicate suppressed" };
  try {
    await sendMail(to, subject, html);
    await EmailLog.create({ order: order._id, to, subject, eventType, status: "sent" });
    if (statusLabel && order.lastEmailStatusSent !== statusLabel) {
      order.lastEmailStatusSent = statusLabel;
      await order.save({ validateModifiedOnly: true });
    }
    return { success: true };
  } catch (err) {
    await EmailLog.create({ order: order._id, to, subject, eventType, status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}

export async function sendOrderCancellationEmail(order, reason) {
  const to = order.customer?.email;
  if (!to) return { success: false, error: "No customer email" };
  const itemsHtml = buildItemsHtml(order.items);
  const body = `
<p style="margin:0 0 16px;color:#333;font-size:16px">Dear ${order.customer?.name || "Valued Customer"},</p>
<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
${reason ? `<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Reason: <em>${reason}</em></p>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><th style="padding:8px;border-bottom:2px solid ${ACCENT_RED};text-align:left;color:#333">Item</th><th style="padding:8px;border-bottom:2px solid ${ACCENT_RED};text-align:right;color:#333">Total</th></tr>
${itemsHtml}
<tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">LKR ${order.total.toLocaleString()}</td></tr>
</table>
<div style="margin-top:24px;padding:16px;background:#fff5f5;border-radius:6px;border:1px solid #fcc">
<p style="margin:0;color:#991b1b;font-size:14px"><strong>What happens next?</strong></p>
<p style="margin:8px 0 0;color:#555;font-size:14px;line-height:1.5">If a payment was made, the refund will be processed within 5-7 business days. If you have any questions, please contact our support team.</p>
</div>
<p style="margin:24px 0 0;color:#888;font-size:13px">Need help? Reply to this email or contact us at <a href="mailto:minihobbies34@gmail.com" style="color:${ACCENT_RED}">minihobbies34@gmail.com</a></p>`;
  return sendWithDedup({
    order,
    to,
    subject: `Order #${order.orderNumber} Cancelled - Mini Hobbies`,
    eventType: "ORDER_CANCELLED",
    html: wrapHtml("Order Cancelled", ACCENT_RED, body),
    statusLabel: "CANCELLED"
  });
}

export async function sendShipmentCreatedEmail(order, waybillId, trackingUrl) {
  const to = order.customer?.email;
  if (!to) return { success: false, error: "No customer email" };
  const itemsHtml = buildItemsHtml(order.items);
  const deliveryAddress = order.customer?.address || "";
  const deliveryCity = order.customer?.city || "";
  const deliveryDistrict = order.customer?.district || "";
  const shipmentDate = new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" });
  const body = `
<p style="margin:0 0 16px;color:#333;font-size:16px">Dear ${order.customer?.name || "Valued Customer"},</p>
<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Great news! Your order <strong>#${order.orderNumber}</strong> has been shipped via <strong>Koombiyo Delivery</strong>.</p>
<div style="margin:20px 0;padding:20px;background:#f0faf2;border-radius:6px;border:1px solid #b8e6c8">
<p style="margin:0 0 8px;color:#333;font-size:15px"><strong>Shipment Details</strong></p>
<p style="margin:0 0 4px;color:#555;font-size:14px">Waybill ID: <strong style="color:${ACCENT_GREEN}">${waybillId}</strong></p>
<p style="margin:0 0 4px;color:#555;font-size:14px">Order Number: <strong>#${order.orderNumber}</strong></p>
<p style="margin:0 0 4px;color:#555;font-size:14px">Shipment Date: <strong>${shipmentDate}</strong></p>
<p style="margin:0 0 4px;color:#555;font-size:14px">Delivery Address: <strong>${deliveryAddress}${deliveryCity ? ", " + deliveryCity : ""}${deliveryDistrict ? ", " + deliveryDistrict : ""}</strong></p>
${trackingUrl ? `<p style="margin:8px 0 0;color:#555;font-size:14px">Track your package: <a href="${trackingUrl}" style="color:${ACCENT_GREEN}" target="_blank">${trackingUrl}</a></p>` : ""}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><th style="padding:8px;border-bottom:2px solid ${ACCENT_GREEN};text-align:left;color:#333">Item</th><th style="padding:8px;border-bottom:2px solid ${ACCENT_GREEN};text-align:right;color:#333">Total</th></tr>
${itemsHtml}
<tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">LKR ${order.total.toLocaleString()}</td></tr>
</table>
<p style="margin:24px 0 0;color:#888;font-size:13px">Need help? Reply to this email or contact us at <a href="mailto:minihobbies34@gmail.com" style="color:${ACCENT_GREEN}">minihobbies34@gmail.com</a></p>`;
  return sendWithDedup({
    order,
    to,
    subject: `Your Mini Hobbies Order Has Been Shipped - #${order.orderNumber}`,
    eventType: "ORDER_SHIPPED",
    html: wrapHtml("Your Order Has Been Shipped!", ACCENT_GREEN, body),
    statusLabel: "SHIPPED"
  });
}

export async function sendStatusUpdateEmail(order, newStatus, extra = {}) {
  const to = order.customer?.email;
  if (!to) return { success: false, error: "No customer email" };
  const statusLabels = {
    SHIPPED: "Shipped",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    RETURNED: "Returned",
    CANCELLED: "Cancelled"
  };
  const label = statusLabels[newStatus] || newStatus;
  const eventType = newStatus === "DELIVERED" ? "ORDER_DELIVERED" : "STATUS_UPDATED";
  const accentColor = newStatus === "DELIVERED" ? ACCENT_GREEN : newStatus === "CANCELLED" || newStatus === "RETURNED" ? ACCENT_RED : ACCENT_AMBER;
  const body = `
<p style="margin:0 0 16px;color:#333;font-size:16px">Dear ${order.customer?.name || "Valued Customer"},</p>
<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong style="color:${accentColor}">${label}</strong>.</p>
${extra.location ? `<p style="margin:0 0 16px;color:#555;font-size:15px">Current location: ${extra.location}</p>` : ""}
${extra.note ? `<p style="margin:0 0 16px;color:#555;font-size:15px">Note: ${extra.note}</p>` : ""}
${extra.waybillId ? `<div style="margin:20px 0;padding:16px;background:#f5f5f5;border-radius:6px">
<p style="margin:0;color:#555;font-size:14px">Waybill ID: <strong>${extra.waybillId}</strong></p>
${order.delivery?.trackingUrl ? `<p style="margin:4px 0 0;color:#555;font-size:14px">Track: <a href="${order.delivery.trackingUrl}" style="color:${accentColor}" target="_blank">${order.delivery.trackingUrl}</a></p>` : ""}</div>` : ""}
${newStatus === "DELIVERED" ? `<div style="margin-top:24px;padding:16px;background:#f0faf2;border-radius:6px;border:1px solid #b8e6c8"><p style="margin:0;color:#1a7a2e;font-size:15px">Thank you for shopping with us! We hope you enjoy your purchase.</p></div>` : ""}
${newStatus === "RETURNED" || newStatus === "CANCELLED" ? `<div style="margin-top:24px;padding:16px;background:#fff5f5;border-radius:6px;border:1px solid #fcc"><p style="margin:0;color:#991b1b;font-size:14px">If you have any questions about this update, please contact our support team.</p></div>` : ""}
<p style="margin:24px 0 0;color:#888;font-size:13px">Need help? Reply to this email or contact us at <a href="mailto:minihobbies34@gmail.com" style="color:${accentColor}">minihobbies34@gmail.com</a></p>`;
  return sendWithDedup({
    order,
    to,
    subject: `Order #${order.orderNumber} Status Update - ${label} - Mini Hobbies`,
    eventType,
    html: wrapHtml("Order Status Update", accentColor, body),
    statusLabel: newStatus
  });
}
