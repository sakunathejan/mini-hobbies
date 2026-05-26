const welcomeHtml = (customer, verifyUrl, logoBase64 = "") => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Mini Hobbies</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<center>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<tr><td style="padding:40px 32px 28px;text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b,#334155);">
${logoBase64 ? '<img src="' + logoBase64 + '" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;filter:brightness(0)invert(1);border-radius:8px;" />' : '<h1 style="margin:0 0 8px;font-size:22px;color:#fff;font-weight:900;">MINI HOBBIES</h1>'}
<h2 style="margin:0;font-size:20px;color:#fff;font-weight:800;">Welcome, ${customer.name}!</h2>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">Your collector journey begins now.</p>
</td></tr>

<tr><td style="padding:24px 32px 0;">
<p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">
Thank you for creating an account at <b style="color:#0f172a;">Mini Hobbies</b>. You now have access to order tracking, wishlists, and exclusive collectible drops.
</p>
</td></tr>

<tr><td style="padding:16px 32px 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
<tr><td style="padding:12px 16px;">
<p style="margin:0;font-size:13px;color:#166534;"><b>&#10003; Account created</b></p>
<p style="margin:4px 0 0;font-size:12px;color:#15803d;">Track orders, save your wishlist, and manage your collection.</p>
</td></tr>
</table>
</td></tr>

${verifyUrl ? '<tr><td style="padding:20px 32px 0;text-align:center;"><a href="' + verifyUrl + '" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">Verify Email Address</a><p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">This link expires in 24 hours.</p></td></tr>' : ""}

<tr><td style="padding:28px 32px 24px;text-align:center;">
<div style="height:1px;background:#e2e8f0;margin-bottom:16px;"></div>
<p style="margin:0;font-size:13px;color:#475569;">Mini Hobbies — Collectibles &amp; Die-Cast</p>
<p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} Mini Hobbies. All rights reserved.</p>
</td></tr>

</table>
</td></tr></table>
</center>
</body></html>`;

export default welcomeHtml;
