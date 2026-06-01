import { sendMail } from "../services/emailService.js";
import ModerationCase from "./ModerationCase.js";

const base = () => process.env.CLIENT_URL || "http://localhost:5173";

function formatModerationHtml(customerName, type, reason, details) {
  const logo = "";
  const typeLabels = { warning: "Warning", suspension: "Suspension", ban: "Account Ban" };
  const typeColors = { warning: "#d97706", suspension: "#ea580c", ban: "#dc2626" };
  const label = typeLabels[type] || "Notice";
  const color = typeColors[type] || "#475569";

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
${logo ? '<img src="'+logo+'" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;" />' : '<h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Mini Hobbies</h1>'}
<div style="width:48px;height:48px;border-radius:50%;background:${color}20;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
  <span style="font-size:24px;color:${color};">!</span>
</div>
<h2 style="margin:0;font-size:18px;color:${color};">${label}</h2>
<p style="margin:16px 0 0;font-size:14px;color:#475569;line-height:1.6;">Hi <b>${customerName}</b>,</p>
<p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.6;">${details}</p>
<div style="margin:16px 0 0;padding:12px 16px;background:#f8fafc;border-radius:8px;text-align:left;">
<p style="margin:0;font-size:13px;color:#64748b;"><b>Reason:</b> ${reason}</p>
${type === "suspension" ? '<p style="margin:6px 0 0;font-size:13px;color:#64748b;">This suspension will expire automatically.</p>' : ""}
</div>
<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">If you believe this was a mistake, you can submit an appeal from your account.</p>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;
}

export async function sendModerationEmail(modCase, customerEmail, customerName) {
  const typeLabels = { warning: "Warning", suspension: "Suspension", ban: "Account Ban" };
  const subject = `Mini Hobbies - ${typeLabels[modCase.type] || "Notice"}`;

  let details = "";
  if (modCase.type === "warning") {
    details = "You have received a warning on your account.";
  } else if (modCase.type === "suspension") {
    const hours = modCase.duration || 0;
    details = `Your account has been temporarily suspended for ${hours} hour${hours !== 1 ? "s" : ""}.`;
  } else if (modCase.type === "ban") {
    details = "Your account has been permanently banned.";
  }

  await sendMail(
    customerEmail,
    subject,
    formatModerationHtml(customerName, modCase.type, modCase.reason, details),
  );

  await ModerationCase.updateOne({ _id: modCase._id }, { $set: { emailSent: true } });
}

export async function sendAppealEmail(modCase, customerEmail, customerName) {
  const subject = "Mini Hobbies - Appeal Received";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
<h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Mini Hobbies</h1>
<h2 style="margin:0;font-size:18px;color:#2563eb;">Appeal Received</h2>
<p style="margin:16px 0 0;font-size:14px;color:#475569;">Hi <b>${customerName}</b>,</p>
<p style="margin:4px 0 0;font-size:14px;color:#475569;">We have received your appeal regarding your account moderation. Our team will review it and get back to you.</p>
<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">This is an automated message — please do not reply.</p>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;

  await sendMail(customerEmail, subject, html);
}

export async function sendAppealResponseEmail(modCase, customerEmail, customerName, action) {
  const subject = "Mini Hobbies - Appeal Update";

  const outcome = action === "lift"
    ? "Your appeal has been accepted and the moderation action has been lifted."
    : "Your appeal has been reviewed and the moderation action remains in place.";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<center>
<table width="100%"><tr><td align="center" style="padding:40px 16px;">
<table width="480" style="background:#fff;border-radius:12px;">
<tr><td style="padding:32px;text-align:center;">
<h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Mini Hobbies</h1>
<h2 style="margin:0;font-size:18px;color:${action === "lift" ? "#16a34a" : "#dc2626"};">${action === "lift" ? "Appeal Accepted" : "Appeal Denied"}</h2>
<p style="margin:16px 0 0;font-size:14px;color:#475569;">Hi <b>${customerName}</b>,</p>
<p style="margin:4px 0 0;font-size:14px;color:#475569;">${outcome}</p>
${modCase.appealResponse ? `<div style="margin:16px 0 0;padding:12px 16px;background:#f8fafc;border-radius:8px;text-align:left;"><p style="margin:0;font-size:13px;color:#64748b;"><b>Response:</b> ${modCase.appealResponse}</p></div>` : ""}
<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">This is an automated message — please do not reply.</p>
</td></tr></table>
</td></tr></table>
</center>
</body></html>`;

  await sendMail(customerEmail, subject, html);
}
