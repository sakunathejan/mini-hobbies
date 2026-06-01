import { sendMail } from "../emailService.js";
import EmailLog from "../../models/EmailLog.js";

export async function sendOrderCancellationEmail(order, reason) {
  const to = order.customer?.email;
  if (!to) return { success: false, error: "No customer email" };

  const alreadySent = await EmailLog.findOne({
    order: order._id,
    eventType: "ORDER_CANCELLED",
    status: "sent"
  });
  if (alreadySent) return { success: false, error: "Duplicate suppressed" };

  const subject = `Order #${order.orderNumber} Cancelled - Mini Hobbies`;
  const itemsHtml = (order.items || [])
    .map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name} x${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">LKR ${(i.price * i.quantity).toLocaleString()}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#991b1b;padding:24px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px">Order Cancelled</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;color:#333;font-size:16px">Dear ${order.customer?.name || "Valued Customer"},</p>
<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
${reason ? `<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Reason: <em>${reason}</em></p>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><th style="padding:8px;border-bottom:2px solid #991b1b;text-align:left;color:#333">Item</th><th style="padding:8px;border-bottom:2px solid #991b1b;text-align:right;color:#333">Total</th></tr>
${itemsHtml}
<tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">LKR ${order.total.toLocaleString()}</td></tr>
</table>
<div style="margin-top:24px;padding:16px;background:#fff5f5;border-radius:6px;border:1px solid #fcc">
<p style="margin:0;color:#991b1b;font-size:14px"><strong>What happens next?</strong></p>
<p style="margin:8px 0 0;color:#555;font-size:14px;line-height:1.5">If a payment was made, the refund will be processed within 5-7 business days. If you have any questions, please contact our support team.</p>
</div>
<p style="margin:24px 0 0;color:#888;font-size:13px">Need help? Reply to this email or contact us at <a href="mailto:minihobbies34@gmail.com" style="color:#991b1b">minihobbies34@gmail.com</a></p>
</td></tr>
<tr><td style="background:#333;padding:16px;text-align:center">
<p style="margin:0;color:#aaa;font-size:12px">Mini Hobbies &bull; All Rights Reserved</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  try {
    await sendMail(to, subject, html);
    await EmailLog.create({ order: order._id, to, subject, eventType: "ORDER_CANCELLED", status: "sent" });
    return { success: true };
  } catch (err) {
    await EmailLog.create({ order: order._id, to, subject, eventType: "ORDER_CANCELLED", status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}

export async function sendShipmentCreatedEmail(order, waybillId, trackingUrl) {
  const to = order.customer?.email;
  if (!to) return { success: false, error: "No customer email" };

  const alreadySent = await EmailLog.findOne({
    order: order._id,
    eventType: "ORDER_SHIPPED",
    status: "sent"
  });
  if (alreadySent) return { success: false, error: "Duplicate suppressed" };

  const subject = `Order #${order.orderNumber} Has Been Shipped! - Mini Hobbies`;
  const itemsHtml = (order.items || [])
    .map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name} x${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">LKR ${(i.price * i.quantity).toLocaleString()}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#1a7a2e;padding:24px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px">Your Order Has Been Shipped! 🚚</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;color:#333;font-size:16px">Dear ${order.customer?.name || "Valued Customer"},</p>
<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Great news! Your order <strong>#${order.orderNumber}</strong> has been shipped via <strong>Koombiyo Delivery</strong>.</p>
<div style="margin:20px 0;padding:20px;background:#f0faf2;border-radius:6px;border:1px solid #b8e6c8">
<p style="margin:0 0 8px;color:#333;font-size:15px"><strong>Tracking Information</strong></p>
<p style="margin:0 0 4px;color:#555;font-size:14px">Waybill ID: <strong style="color:#1a7a2e">${waybillId}</strong></p>
${trackingUrl ? `<p style="margin:0;color:#555;font-size:14px">Track your package: <a href="${trackingUrl}" style="color:#1a7a2e" target="_blank">${trackingUrl}</a></p>` : ""}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><th style="padding:8px;border-bottom:2px solid #1a7a2e;text-align:left;color:#333">Item</th><th style="padding:8px;border-bottom:2px solid #1a7a2e;text-align:right;color:#333">Total</th></tr>
${itemsHtml}
<tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">LKR ${order.total.toLocaleString()}</td></tr>
</table>
<p style="margin:24px 0 0;color:#888;font-size:13px">Need help? Reply to this email or contact us at <a href="mailto:minihobbies34@gmail.com" style="color:#1a7a2e">minihobbies34@gmail.com</a></p>
</td></tr>
<tr><td style="background:#333;padding:16px;text-align:center">
<p style="margin:0;color:#aaa;font-size:12px">Mini Hobbies &bull; All Rights Reserved</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  try {
    await sendMail(to, subject, html);
    await EmailLog.create({ order: order._id, to, subject, eventType: "ORDER_SHIPPED", status: "sent" });
    return { success: true };
  } catch (err) {
    await EmailLog.create({ order: order._id, to, subject, eventType: "ORDER_SHIPPED", status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}

export async function sendStatusUpdateEmail(order, newStatus, extra = {}) {
  const to = order.customer?.email;
  if (!to) return { success: false, error: "No customer email" };

  const eventType = newStatus === "DELIVERED" ? "ORDER_DELIVERED" : "STATUS_UPDATED";
  const subject = newStatus === "DELIVERED"
    ? `Order #${order.orderNumber} Has Been Delivered! - Mini Hobbies`
    : `Order #${order.orderNumber} Status Update - ${newStatus} - Mini Hobbies`;

  const statusLabels = {
    SHIPPED: "Shipped",
    IN_TRANSIT: "In Transit",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    RETURNED: "Returned"
  };
  const label = statusLabels[newStatus] || newStatus;
  const accentColor = newStatus === "DELIVERED" ? "#1a7a2e" : "#e8951a";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:${accentColor};padding:24px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px">Order Status Update</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;color:#333;font-size:16px">Dear ${order.customer?.name || "Valued Customer"},</p>
<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong style="color:${accentColor}">${label}</strong>.</p>
${extra.location ? `<p style="margin:0 0 16px;color:#555;font-size:15px">Current location: ${extra.location}</p>` : ""}
${extra.note ? `<p style="margin:0 0 16px;color:#555;font-size:15px">Note: ${extra.note}</p>` : ""}
${extra.waybillId ? `<div style="margin:20px 0;padding:16px;background:#f5f5f5;border-radius:6px"><p style="margin:0;color:#555;font-size:14px">Waybill ID: <strong>${extra.waybillId}</strong></p></div>` : ""}
${newStatus === "DELIVERED" ? `<div style="margin-top:24px;padding:16px;background:#f0faf2;border-radius:6px;border:1px solid #b8e6c8"><p style="margin:0;color:#1a7a2e;font-size:15px">Thank you for shopping with us! We hope you enjoy your purchase.</p></div>` : ""}
<p style="margin:24px 0 0;color:#888;font-size:13px">Need help? Reply to this email or contact us at <a href="mailto:minihobbies34@gmail.com" style="color:${accentColor}">minihobbies34@gmail.com</a></p>
</td></tr>
<tr><td style="background:#333;padding:16px;text-align:center">
<p style="margin:0;color:#aaa;font-size:12px">Mini Hobbies &bull; All Rights Reserved</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  try {
    await sendMail(to, subject, html);
    await EmailLog.create({ order: order._id, to, subject, eventType, status: "sent" });
    return { success: true };
  } catch (err) {
    await EmailLog.create({ order: order._id, to, subject, eventType, status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}
