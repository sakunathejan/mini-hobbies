import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const logoSrc = (() => {
  const paths = [
    join(__dirname, "..", "..", "..", "frontend", "public", "logo.png"),
    join(__dirname, "..", "..", "public", "logo.png"),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      const ext = p.endsWith(".png") ? "png" : "jpg";
      const b64 = readFileSync(p).toString("base64");
      return `data:image/${ext};base64,${b64}`;
    }
  }
  return "";
})();

const FOOTER = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
    <p>Mini Hobbies &mdash; Your Miniature Collectible Store</p>
    <p>If you have questions, reply to this email or contact us on WhatsApp.</p>
  </div>`;

export function reviewApprovedTemplate({ customerName, productName, reviewTitle }) {
  return {
    subject: "Your review has been approved!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        ${logoSrc ? `<img src="${logoSrc}" alt="Mini Hobbies" style="height:40px;margin-bottom:24px" />` : ""}
        <h1 style="font-size:20px;font-weight:800;margin:0">Review approved</h1>
        <p style="color:#374151;line-height:1.6">Hi ${customerName},</p>
        <p style="color:#374151;line-height:1.6">
          Your review of <strong>${productName}</strong>${reviewTitle ? ` &mdash; "${reviewTitle}"` : ""} has been approved and is now visible on the product page.
        </p>
        <p style="color:#374151;line-height:1.6">Thank you for sharing your experience!</p>
        ${FOOTER}
      </div>`,
  };
}

export function reviewRejectedTemplate({ customerName, productName, reviewTitle, reason }) {
  return {
    subject: "Your review was not approved",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        ${logoSrc ? `<img src="${logoSrc}" alt="Mini Hobbies" style="height:40px;margin-bottom:24px" />` : ""}
        <h1 style="font-size:20px;font-weight:800;margin:0">Review not approved</h1>
        <p style="color:#374151;line-height:1.6">Hi ${customerName},</p>
        <p style="color:#374151;line-height:1.6">
          Your review of <strong>${productName}</strong>${reviewTitle ? ` &mdash; "${reviewTitle}"` : ""} was not approved.
        </p>
        ${reason ? `<p style="color:#374151;line-height:1.6">Reason: ${reason}</p>` : ""}
        <p style="color:#374151;line-height:1.6">You can edit and resubmit your review from your account dashboard.</p>
        ${FOOTER}
      </div>`,
  };
}

export function adminResponseTemplate({ customerName, productName, adminName, response }) {
  return {
    subject: "Store response to your review",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        ${logoSrc ? `<img src="${logoSrc}" alt="Mini Hobbies" style="height:40px;margin-bottom:24px" />` : ""}
        <h1 style="font-size:20px;font-weight:800;margin:0">Store responded to your review</h1>
        <p style="color:#374151;line-height:1.6">Hi ${customerName},</p>
        <p style="color:#374151;line-height:1.6">
          ${adminName} has responded to your review of <strong>${productName}</strong>:
        </p>
        <blockquote style="border-left:3px solid #d97706;padding:12px 16px;margin:16px 0;color:#374151;font-style:italic;background:#fffbeb;border-radius:4px">
          ${response}
        </blockquote>
        ${FOOTER}
      </div>`,
  };
}

export function newReviewNotificationTemplate({ customerName, productName, rating, comment }) {
  return {
    subject: `New review: ${productName} (${rating}\u2605)`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        ${logoSrc ? `<img src="${logoSrc}" alt="Mini Hobbies" style="height:40px;margin-bottom:24px" />` : ""}
        <h1 style="font-size:20px;font-weight:800;margin:0">New review submitted</h1>
        <p style="color:#374151;line-height:1.6">
          <strong>${customerName}</strong> reviewed <strong>${productName}</strong> &mdash; ${rating}/5
        </p>
        <blockquote style="border-left:3px solid #d97706;padding:12px 16px;margin:16px 0;color:#374151;background:#fffbeb;border-radius:4px">
          ${comment}
        </blockquote>
        <p style="color:#374151;line-height:1.6">
          <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/admin/reviews" style="color:#d97706;font-weight:600">Review in admin panel</a>
        </p>
        ${FOOTER}
      </div>`,
  };
}

export function newReplyNotificationTemplate({ customerName, replierName, replyMessage }) {
  return {
    subject: `${replierName} replied to your review`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        ${logoSrc ? `<img src="${logoSrc}" alt="Mini Hobbies" style="height:40px;margin-bottom:24px" />` : ""}
        <h1 style="font-size:20px;font-weight:800;margin:0">New reply on your review</h1>
        <p style="color:#374151;line-height:1.6">Hi ${customerName},</p>
        <p style="color:#374151;line-height:1.6"><strong>${replierName}</strong> replied to your review:</p>
        <blockquote style="border-left:3px solid #d97706;padding:12px 16px;margin:16px 0;color:#374151;font-style:italic;background:#fffbeb;border-radius:4px">
          ${replyMessage}
        </blockquote>
        ${FOOTER}
      </div>`,
  };
}
