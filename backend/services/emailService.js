import nodemailer from "nodemailer";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let transporter = null;
let logoBase64 = "";

const getTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000
  });
  return transporter;
};

const loadLogo = () => {
  if (logoBase64) return logoBase64;
  const paths = [
    join(__dirname, "..", "..", "frontend", "public", "logo.png"),
    join(__dirname, "..", "public", "logo.png"),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      logoBase64 = "data:image/png;base64," + readFileSync(p).toString("base64");
      return logoBase64;
    }
  }
  return "";
};

const FROM = () => `"${process.env.SMTP_FROM_NAME || "Mini Hobbies"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@minihobbies.lk"}>`;

const fmt = (n) => "LKR " + Number(n || 0).toLocaleString("en-LK");

const formatPaymentVerificationHtml = (order, action, note) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const logo = loadLogo();
  const ml = { bank_transfer: "Bank Transfer", cod: "Cash on Delivery", advance: "50% Advance" };
  const items = order.items || [];
  const c = order.customer || {};
  const s = order.status || "";
  const isAccepted = action === "verified";

  const itemRows = items.map((item, i) =>
    `<tr${i === items.length - 1 ? '' : ''}>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${item.name || "Product"}${item.variantName ? ' <span style="color:#64748b;font-size:11px;">(' + item.variantName + ')</span>' : ''}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#64748b;">${item.quantity || 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;color:#1e293b;font-weight:600;">${fmt((item.price || 0) * (item.quantity || 1))}</td>
    </tr>`
  ).join("");

  const sc = {
    "Pending Advance Payment": "#92400e",
    "Pending Payment Verification": "#9a3412",
    "Payment Confirmed": "#16a34a",
    "Advance Payment Submitted": "#9a3412",
    "Advance Payment Confirmed": "#166534",
    "Awaiting Final Payment": "#9a3412",
    "Fully Paid": "#166534",
    "Preparing Order": "#2563eb",
    "Shipped": "#1e40af",
    "Delivered": "#166534",
    "Cancelled": "#991b1b"
  };
  const st = sc[s] || "#475569";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<center>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 10px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">

<tr><td style="padding:32px 28px 24px;text-align:center;background:${isAccepted ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#dc2626,#ef4444)"};">
${logo ? '<img src="' + logo + '" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;filter:brightness(0)invert(1);" />' : '<h1 style="margin:0 0 16px;font-size:20px;color:#fff;">Mini Hobbies</h1>'}
<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
  <span style="font-size:28px;line-height:1;color:#fff;">${isAccepted ? "&#10003;" : "&#10007;"}</span>
</div>
<h2 style="margin:0;font-size:20px;color:#fff;letter-spacing:-0.3px;">Payment ${isAccepted ? "Verified" : "Rejected"}</h2>
<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Order #${order.orderNumber}</p>
</td></tr>

<tr><td style="padding:24px 28px 0;text-align:center;">
<h3 style="margin:0;font-size:16px;color:#0f172a;">Hi ${c.name || "there"},</h3>
<p style="margin:8px 0 0;font-size:13px;color:#475569;">${isAccepted ? "Great news! Your payment has been verified successfully." : "Unfortunately, your payment could not be verified."}</p>
</td></tr>

${note ? '<tr><td style="padding:16px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:' + (isAccepted ? '#f0fdf4;border:1px solid #bbf7d0;' : '#fef2f2;border:1px solid #fecaca;') + '"><tr><td style="padding:12px 16px;"><p style="margin:0;font-size:13px;color:' + (isAccepted ? '#166534' : '#991b1b') + ';"><b>' + (isAccepted ? "Note:" : "Reason:") + '</b> ' + note + '</p></td></tr></table></td></tr>' : ""}

${!isAccepted ? '<tr><td style="padding:16px 28px 0;text-align:center;"><p style="margin:0;font-size:13px;color:#475569;">Please upload a new valid payment slip through your order tracking page to continue.</p></td></tr>' : ""}

<tr><td style="padding:16px 28px 0;">
<p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;">ORDER SUMMARY</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
<tr><td style="padding:12px 16px;">
<p style="margin:0 0 4px;font-size:11px;color:#94a3b8;font-weight:700;">CUSTOMER</p>
<p style="margin:0;font-size:13px;color:#1e293b;"><b>${c.name || "—"}</b></p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${c.phone || "—"} | ${c.email || "—"}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${c.address || ""}${c.district ? ", " + c.district : ""}</p>
</td></tr></table>
</td></tr>

<tr><td style="padding:12px 28px 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;">
<tr style="background:#f8fafc;">
<td style="padding:7px 14px;font-size:10px;color:#94a3b8;font-weight:700;">Item</td>
<td style="padding:7px 14px;font-size:10px;color:#94a3b8;font-weight:700;text-align:center;">Qty</td>
<td style="padding:7px 14px;font-size:10px;color:#94a3b8;font-weight:700;text-align:right;">Total</td>
</tr>
${itemRows}
</table>
</td></tr>

<tr><td style="padding:12px 28px 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;">
<tr><td style="padding:8px 16px;font-size:13px;color:#64748b;">Method</td><td style="padding:8px 16px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;">${ml[order.paymentMethod] || order.paymentMethod || "N/A"}</td></tr>
<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Subtotal</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#0f172a;">${fmt(order.subtotal)}</td></tr>
<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Delivery</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#0f172a;">${fmt(order.deliveryFee)}</td></tr>
${order.discount > 0 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Discount</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#dc2626;">-' + fmt(order.discount) + '</td></tr>' : ""}
${order.paymentMethod === "advance" && order.advanceAmount > 0 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Advance Paid</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#16a34a;font-weight:600;">-' + fmt(order.advanceAmount) + '</td></tr>' : ""}
${order.paymentMethod === "advance" && order.remainingBalance > 0 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Remaining</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#d97706;font-weight:700;">' + fmt(order.remainingBalance) + '</td></tr>' : ""}
<tr><td style="padding:10px 16px;font-size:14px;font-weight:800;color:#0f172a;border-top:2px solid #0f172a;">Total</td><td style="padding:10px 16px;text-align:right;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #0f172a;">${fmt(order.total)}</td></tr>
</table>
</td></tr>

${isAccepted && order.__bankDetails ? '<tr><td style="padding:12px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;"><tr><td style="padding:10px 16px;"><p style="margin:0 0 4px;font-size:11px;color:#16a34a;font-weight:700;">BANK DETAILS FOR REFERENCE</p><p style="margin:0;font-size:12px;color:#166534;">' + order.__bankDetails.bankName + '</p><p style="margin:2px 0 0;font-size:12px;color:#166534;">' + order.__bankDetails.accountName + ' - ' + order.__bankDetails.accountNumber + '</p><p style="margin:2px 0 0;font-size:12px;color:#166534;">' + order.__bankDetails.branch + '</p></td></tr></table></td></tr>' : ''}

<tr><td style="padding:20px 28px 0;text-align:center;">
<a href="${base}/track-order?order=${order.orderNumber}&phone=${encodeURIComponent(c.phone || "")}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">Track Your Order</a>
</td></tr>

<tr><td style="padding:24px 28px;text-align:center;">
<div style="height:1px;background:#e2e8f0;margin-bottom:14px;"></div>
<p style="margin:0;font-size:12px;color:#64748b;">Thank you for shopping with <b style="color:#0f172a;">Mini Hobbies</b></p>
<p style="margin:3px 0 0;font-size:11px;color:#94a3b8;">This is an automated message &mdash; please do not reply.</p>
</td></tr>

</table>
<p style="margin:10px 0 0;font-size:11px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Mini Hobbies</p>
</td></tr></table>
</center>
</body></html>`;
};

const formatEmailHtml = (order, note) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const logo = loadLogo();
  const ml = { bank_transfer: "Bank Transfer", cod: "Cash on Delivery", advance: "50% Advance" };
  const items = order.items || [];
  const c = order.customer || {};
  const s = order.status || "";

  const itemRows = items.map((item, i) =>
    `<tr${i === items.length - 1 ? '' : ''}>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${item.name || "Product"}${item.variantName ? ' <span style="color:#64748b;font-size:11px;">(' + item.variantName + ')</span>' : ''}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#64748b;">${item.quantity || 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;color:#1e293b;font-weight:600;">${fmt((item.price || 0) * (item.quantity || 1))}</td>
    </tr>`
  ).join("");

  const sc = {
    "Pending Advance Payment": "#92400e",
    "Pending Payment Verification": "#9a3412",
    "Payment Confirmed": "#16a34a",
    "Advance Payment Submitted": "#9a3412",
    "Advance Payment Confirmed": "#166534",
    "Awaiting Final Payment": "#9a3412",
    "Fully Paid": "#166534",
    "Preparing Order": "#2563eb",
    "Shipped": "#1e40af",
    "Delivered": "#166534",
    "Cancelled": "#991b1b",
  };
  const st = sc[s] || "#475569";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<center>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 10px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;">

<tr><td style="padding:24px 28px 10px;text-align:center;">
${logo ? '<img src="' + logo + '" alt="Mini Hobbies" width="120" style="display:inline-block;" />' : '<h1 style="margin:0;font-size:22px;color:#0f172a;">Mini Hobbies</h1>'}
</td></tr>

<tr><td style="padding:5px 28px 0;text-align:center;">
<span style="display:inline-block;background:#f1f5f9;color:${st};padding:5px 18px;border-radius:12px;font-size:12px;font-weight:700;">${s}</span>
</td></tr>

<tr><td style="padding:16px 28px 0;">
<p style="margin:0;font-size:12px;color:#94a3b8;">ORDER #${order.orderNumber}</p>
<h2 style="margin:4px 0 0;font-size:18px;color:#0f172a;">Hi ${c.name || "there"},</h2>
<p style="margin:6px 0 0;font-size:13px;color:#475569;">Your order status has been updated.</p>
</td></tr>

${note ? '<tr><td style="padding:12px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;"><tr><td style="padding:10px 14px;font-size:13px;color:#854d0e;"><b>Note:</b> ' + note + '</td></tr></table></td></tr>' : ""}

<tr><td style="padding:16px 28px 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
<tr><td style="padding:12px 16px;">
<p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;">CUSTOMER</p>
<p style="margin:0;font-size:13px;color:#1e293b;"><b>${c.name || "—"}</b></p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${c.phone || "—"} | ${c.email || "—"}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${c.address || ""}${c.district ? ", " + c.district : ""}</p>
</td></tr></table>
</td></tr>

<tr><td style="padding:16px 28px 0;">
<p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;">ITEMS</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;">
<tr style="background:#f8fafc;">
<td style="padding:7px 14px;font-size:10px;color:#94a3b8;font-weight:700;">Item</td>
<td style="padding:7px 14px;font-size:10px;color:#94a3b8;font-weight:700;text-align:center;">Qty</td>
<td style="padding:7px 14px;font-size:10px;color:#94a3b8;font-weight:700;text-align:right;">Total</td>
</tr>
${itemRows}
</table>
</td></tr>

<tr><td style="padding:12px 28px 0;">
<p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;">PAYMENT</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;">
<tr><td style="padding:8px 16px;font-size:13px;color:#64748b;">Method</td><td style="padding:8px 16px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;">${ml[order.paymentMethod] || order.paymentMethod || "N/A"}</td></tr>
<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Subtotal</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#0f172a;">${fmt(order.subtotal)}</td></tr>
<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Delivery</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#0f172a;">${fmt(order.deliveryFee)}</td></tr>
${order.discount > 0 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Discount</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#dc2626;">-' + fmt(order.discount) + '</td></tr>' : ""}
${order.paymentMethod === "advance" && order.advanceAmount > 0 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Advance Paid</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#16a34a;font-weight:600;">-' + fmt(order.advanceAmount) + '</td></tr>' : ""}
${order.paymentMethod === "advance" && order.remainingBalance > 0 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#64748b;">Remaining</td><td style="padding:6px 16px;text-align:right;font-size:13px;color:#d97706;font-weight:700;">' + fmt(order.remainingBalance) + '</td></tr>' : ""}
<tr><td style="padding:10px 16px;font-size:14px;font-weight:800;color:#0f172a;border-top:2px solid #0f172a;">Total</td><td style="padding:10px 16px;text-align:right;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #0f172a;">${fmt(order.total)}</td></tr>
</table>
</td></tr>

${order.__bankDetails ? '<tr><td style="padding:12px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;"><tr><td style="padding:10px 16px;"><p style="margin:0 0 6px;font-size:11px;color:#16a34a;font-weight:700;">BANK DETAILS FOR TRANSFER</p><p style="margin:0;font-size:12px;color:#166534;">' + order.__bankDetails.bankName + '</p><p style="margin:2px 0 0;font-size:12px;color:#166534;">' + order.__bankDetails.accountName + ' - ' + order.__bankDetails.accountNumber + '</p><p style="margin:2px 0 0;font-size:12px;color:#166534;">' + order.__bankDetails.branch + '</p></td></tr></table></td></tr>' : ''}

${order.trackingNumber ? '<tr><td style="padding:12px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #dbeafe;"><tr><td style="padding:10px 16px;text-align:center;"><p style="margin:0;font-size:10px;color:#3b82f6;font-weight:700;">TRACKING</p><p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#1d4ed8;">' + order.trackingNumber + '</p></td></tr></table></td></tr>' : ""}

<tr><td style="padding:18px 28px 0;text-align:center;">
<a href="${base}/track-order?order=${order.orderNumber}&phone=${encodeURIComponent(c.phone || "")}" style="display:inline-block;background:#0f172a;color:#fff;padding:11px 32px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">Track Your Order</a>
</td></tr>

<tr><td style="padding:24px 28px;text-align:center;">
<div style="height:1px;background:#e2e8f0;margin-bottom:14px;"></div>
<p style="margin:0;font-size:12px;color:#64748b;">Thank you for shopping with <b style="color:#0f172a;">Mini Hobbies</b></p>
<p style="margin:3px 0 0;font-size:11px;color:#94a3b8;">This is an automated message &mdash; please do not reply.</p>
</td></tr>

</table>
<p style="margin:10px 0 0;font-size:11px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Mini Hobbies</p>
</td></tr></table>
</center>
</body></html>`;
};

const formatEmailText = (order, note) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const ml = { bank_transfer: "Bank Transfer", cod: "Cash on Delivery", advance: "50% Advance" };
  const items = order.items || [];
  const lines = [
    "MINI HOBBIES - ORDER UPDATE",
    "",
    "Hello " + (order.customer?.name || "Valued Customer") + ",",
    "Your order status has been updated to: " + order.status,
    "",
    "Order: " + order.orderNumber,
    "Status: " + order.status,
    "Payment: " + (ml[order.paymentMethod] || order.paymentMethod || "N/A"),
    "",
    "--- Items ---",
    ...items.map((i) => "  " + i.name + " x" + (i.quantity || 1) + " = " + fmt((i.price || 0) * (i.quantity || 1))),
    "",
    "Subtotal: " + fmt(order.subtotal),
    "Delivery: " + fmt(order.deliveryFee),
  ];
  if (order.discount > 0) lines.push("Discount: -" + fmt(order.discount));
  if (order.paymentMethod === "advance" && order.advanceAmount > 0) lines.push("Advance Paid: -" + fmt(order.advanceAmount));
  if (order.remainingBalance > 0) lines.push("Remaining Balance: " + fmt(order.remainingBalance));
  lines.push("Total: " + fmt(order.total));
  if (order.trackingNumber) lines.push("Tracking: " + order.trackingNumber);
  if (note) lines.push("\nNote: " + note);
  lines.push("\nTrack: " + base + "/track-order?order=" + order.orderNumber + "&phone=" + encodeURIComponent(order.customer?.phone || ""));
  lines.push("\nThank you for shopping with Mini Hobbies!");
  return lines.join("\n");
};

const sendMail = async (to, subject, html, text) => {
  const t = getTransporter();
  if (!t) throw new Error("EMAIL_NOT_CONFIGURED");
  await t.sendMail({
    from: FROM(),
    to,
    subject,
    text: text || "",
    html
  });
};

export const sendPaymentVerificationEmail = async (order, action, note) => {
  const e = order.customer?.email;
  if (!e) throw new Error("Customer email not available");

  const { default: BankDetail } = await import("../models/BankDetail.js");
  const bankDetail = await BankDetail.findOne().sort({ createdAt: -1 }).lean();
  if (bankDetail?.bankName) order.__bankDetails = bankDetail;

  const subject = action === "verified"
    ? "Mini Hobbies - Payment Verified for Order " + order.orderNumber
    : "Mini Hobbies - Payment Rejected for Order " + order.orderNumber;

  await sendMail(e, subject, formatPaymentVerificationHtml(order, action, note));
};

export const sendOrderStatusEmail = async (order, note) => {
  const e = order.customer?.email;
  if (!e) throw new Error("Customer email not available");

  const { default: BankDetail } = await import("../models/BankDetail.js");
  const bankDetail = await BankDetail.findOne().sort({ createdAt: -1 }).lean();
  if (bankDetail?.bankName) order.__bankDetails = bankDetail;

  await sendMail(e, "Mini Hobbies - Order " + order.orderNumber + " - " + order.status, formatEmailHtml(order, note), formatEmailText(order, note));
};

export const sendPasswordResetEmail = async (user, rawToken) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const logo = loadLogo();
  const link = `${base}/admin/reset-password?token=${rawToken}`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
${logo ? '<img src="' + logo + '" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;" />' : ""}
<h2 style="margin:0;font-size:20px;color:#0f172a;">Reset your password</h2>
<p style="margin:12px 0 0;font-size:14px;color:#475569;">Click below to reset your admin password. This link expires in 1 hour.</p>
<a href="${link}" style="display:inline-block;margin-top:20px;background:#0f172a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">Reset Password</a>
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">If you didn't request this, ignore this email.</p>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;

  await sendMail(user.email, "Mini Hobbies - Password Reset", html);
};

export const sendOrderConfirmationEmail = async (order) => {
  const e = order.customer?.email;
  if (!e) throw new Error("Customer email not available");

  const logo = loadLogo();
  const { default: orderConfirmationHtml } = await import("../email-templates/orderConfirmation.js");

  await sendMail(
    e,
    "Mini Hobbies - Order Confirmed " + order.orderNumber,
    orderConfirmationHtml(order, logo)
  );
};

export const sendCustomerWelcomeEmail = async (customer, rawToken) => {
  const logo = loadLogo();
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = rawToken ? `${base}/verify-email?token=${rawToken}` : "";
  const { default: welcomeHtml } = await import("../email-templates/welcomeEmail.js");

  const html = welcomeHtml(customer, verifyUrl, logo);

  const subject = rawToken
    ? "Welcome to Mini Hobbies — Verify your email"
    : "Welcome to Mini Hobbies";

  const text = `Welcome to Mini Hobbies, ${customer.name}!

Thank you for creating an account.

${rawToken ? `Please verify your email address by visiting this link:\n${verifyUrl}\n\nThis link expires in 24 hours.` : ""}

Happy collecting!
- The Mini Hobbies Team`;

  await sendMail(customer.email, subject, html, text);
};

export const sendCustomerVerificationEmail = async (customer, rawToken) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const logo = loadLogo();
  const link = `${base}/verify-email?token=${rawToken}`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
${logo ? '<img src="'+logo+'" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;" />' : ""}
<h2 style="margin:0;font-size:20px;color:#0f172a;">Verify your email</h2>
<p style="margin:12px 0 0;font-size:14px;color:#475569;">Click below to verify your email address and activate your account.</p>
<a href="${link}" style="display:inline-block;margin-top:20px;background:#0f172a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">Verify Email</a>
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">This link expires in 24 hours.</p>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;

  const text = `Verify your email address for Mini Hobbies

Click this link to verify your email:
${link}

This link expires in 24 hours.`;

  await sendMail(customer.email, "Mini Hobbies - Verify Your Email", html, text);
};

export const sendCustomerPasswordResetEmail = async (customer, rawToken) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const logo = loadLogo();
  const link = `${base}/reset-password?token=${rawToken}`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
${logo ? '<img src="'+logo+'" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;" />' : ""}
<h2 style="margin:0;font-size:20px;color:#0f172a;">Reset your password</h2>
<p style="margin:12px 0 0;font-size:14px;color:#475569;">Click below to reset your password. This link expires in 1 hour.</p>
<a href="${link}" style="display:inline-block;margin-top:20px;background:#0f172a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">Reset Password</a>
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">If you didn't request this, ignore this email.</p>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;

  const text = `Reset your Mini Hobbies password

Click this link to reset your password (expires in 1 hour):
${link}

If you didn't request this, ignore this email.`;

  await sendMail(customer.email, "Mini Hobbies - Password Reset", html, text);
};

export const sendVerificationEmail = async (user, rawToken) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const logo = loadLogo();
  const link = `${base}/verify-email?token=${rawToken}`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
${logo ? '<img src="' + logo + '" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;" />' : ""}
<h2 style="margin:0;font-size:20px;color:#0f172a;">Verify your email</h2>
<p style="margin:12px 0 0;font-size:14px;color:#475569;">Click below to verify your email address.</p>
<a href="${link}" style="display:inline-block;margin-top:20px;background:#0f172a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">Verify Email</a>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;

  await sendMail(user.email, "Mini Hobbies - Verify Your Email", html);
};
