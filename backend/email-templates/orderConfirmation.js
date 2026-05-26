const fmt = (n) => "LKR " + Number(n || 0).toLocaleString("en-LK");

const orderConfirmationHtml = (order, logoBase64 = "") => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const ml = { bank_transfer: "Bank Transfer", cod: "Cash on Delivery", advance: "50% Advance" };
  const items = order.items || [];
  const c = order.customer || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const itemCards = items.map((item) => `
    <tr>
      <td style="padding:12px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${item.image ? `<td width="64" style="padding-right:14px;vertical-align:middle;">
              <img src="${item.image}" alt="${item.name}" width="64" height="64" style="display:block;border-radius:8px;object-fit:cover;width:64px;height:64px;" />
            </td>` : ""}
            <td style="vertical-align:middle;">
              <p style="margin:0;font-size:14px;color:#1e293b;font-weight:700;">${item.name || "Product"}${item.variantName ? ' <span style="font-weight:400;color:#64748b;font-size:12px;">(' + item.variantName + ')</span>' : ""}</p>
              <p style="margin:3px 0 0;font-size:13px;color:#64748b;">Qty: ${item.quantity || 1}</p>
            </td>
            <td width="100" style="text-align:right;vertical-align:middle;">
              <p style="margin:0;font-size:14px;color:#1e293b;font-weight:700;">${fmt((item.price || 0) * (item.quantity || 1))}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="border-bottom:1px solid #f1f5f9;padding:0;"></td></tr>
  `).join("");

  const deliveryLine = order.deliveryFee === 0
    ? '<span style="color:#16a34a;">Free Delivery</span>'
    : fmt(order.deliveryFee);

  const statusNote = order.paymentMethod === "cod"
    ? "You will pay upon delivery. No advance payment needed."
    : order.paymentMethod === "advance"
      ? "Your 50% advance payment slip has been received and is being reviewed."
      : "Your bank transfer payment slip has been submitted for verification.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <center>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:100%;">

            <!-- Hero -->
            <tr>
              <td style="padding:40px 32px 28px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%);">
                ${logoBase64 ? '<img src="' + logoBase64 + '" alt="Mini Hobbies" width="100" style="display:inline-block;margin-bottom:16px;filter:brightness(0) invert(1);border-radius:8px;" />' : '<h1 style="margin:0 0 12px;font-size:22px;color:#fff;font-weight:900;">MINI HOBBIES</h1>'}
                <div style="width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,0.2);display:inline-flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                  <span style="font-size:30px;line-height:1;color:#22c55e;">&#10003;</span>
                </div>
                <h2 style="margin:0;font-size:24px;color:#fff;font-weight:800;letter-spacing:-0.5px;">Order Confirmed!</h2>
                <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">Thank you for shopping at Mini Hobbies</p>
              </td>
            </tr>

            <!-- Order Info -->
            <tr>
              <td style="padding:24px 32px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:4px 0;">
                            <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:700;">ORDER NUMBER</p>
                            <p style="margin:2px 0 0;font-size:16px;color:#0f172a;font-weight:800;">${order.orderNumber}</p>
                          </td>
                          <td style="text-align:right;padding:4px 0;">
                            <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:700;">DATE</p>
                            <p style="margin:2px 0 0;font-size:13px;color:#475569;">${dateStr}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Customer -->
            <tr>
              <td style="padding:16px 32px 0;">
                <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                  <b style="color:#0f172a;">Hi ${c.name || "Valued Customer"},</b><br />
                  Your order has been placed successfully. ${statusNote}
                </p>
              </td>
            </tr>

            <!-- Items -->
            <tr>
              <td style="padding:16px 32px 0;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:700;letter-spacing:0.5px;">ITEMS ORDERED</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                  ${itemCards}
                </table>
              </td>
            </tr>

            <!-- Payment Summary -->
            <tr>
              <td style="padding:16px 32px 0;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:700;letter-spacing:0.5px;">PAYMENT SUMMARY</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                  <tr><td style="padding:10px 16px;font-size:13px;color:#64748b;">Payment Method</td><td style="padding:10px 16px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;">${ml[order.paymentMethod] || order.paymentMethod || "N/A"}</td></tr>
                  <tr><td style="padding:6px 16px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;">Subtotal</td><td style="padding:6px 16px;border-top:1px solid #f1f5f9;text-align:right;font-size:13px;color:#0f172a;">${fmt(order.subtotal)}</td></tr>
                  <tr><td style="padding:6px 16px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;">Delivery</td><td style="padding:6px 16px;border-top:1px solid #f1f5f9;text-align:right;font-size:13px;color:#0f172a;">${deliveryLine}</td></tr>
                  ${order.discount > 0 ? '<tr><td style="padding:6px 16px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;">Discount</td><td style="padding:6px 16px;border-top:1px solid #f1f5f9;text-align:right;font-size:13px;color:#dc2626;">-' + fmt(order.discount) + '</td></tr>' : ""}
                  ${order.paymentMethod === "advance" && order.advanceAmount > 0 ? '<tr><td style="padding:6px 16px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;">Advance Paid</td><td style="padding:6px 16px;border-top:1px solid #f1f5f9;text-align:right;font-size:13px;color:#16a34a;font-weight:600;">-' + fmt(order.advanceAmount) + '</td></tr>' : ""}
                  ${order.paymentMethod === "advance" && order.remainingBalance > 0 ? '<tr><td style="padding:6px 16px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;">Remaining Balance</td><td style="padding:6px 16px;border-top:1px solid #f1f5f9;text-align:right;font-size:13px;color:#d97706;font-weight:700;">' + fmt(order.remainingBalance) + '</td></tr>' : ""}
                  <tr><td style="padding:10px 16px;border-top:2px solid #0f172a;font-size:15px;font-weight:800;color:#0f172a;">Total</td><td style="padding:10px 16px;border-top:2px solid #0f172a;text-align:right;font-size:18px;font-weight:800;color:#0f172a;">${fmt(order.total)}</td></tr>
                </table>
              </td>
            </tr>

            <!-- Delivery Info -->
            <tr>
              <td style="padding:12px 32px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <p style="margin:0;font-size:11px;color:#16a34a;font-weight:700;">DELIVERY ADDRESS</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#166534;">${c.name || ""}${c.phone ? " - " + c.phone : ""}</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#166534;">${c.address || ""}${c.district ? ", " + c.district : ""}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Estimated Delivery -->
            <tr>
              <td style="padding:12px 32px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <p style="margin:0;font-size:11px;color:#2563eb;font-weight:700;">ESTIMATED DELIVERY</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#1e40af;">Your order will be processed within 1-3 business days. You will receive a notification once shipped.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA Buttons -->
            <tr>
              <td style="padding:24px 32px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="text-align:center;">
                      <a href="${base}/track-order?order=${order.orderNumber}&phone=${encodeURIComponent(c.phone || "")}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">Track Your Order</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align:center;padding-top:10px;">
                      <a href="${base}/products" style="display:inline-block;color:#64748b;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid #e2e8f0;">Continue Shopping</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:28px 32px 24px;">
                <div style="height:1px;background:#e2e8f0;margin-bottom:20px;"></div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align:center;">
                      <p style="margin:0;font-size:13px;color:#475569;">Mini Hobbies — Collectibles &amp; Die-Cast</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
                        <a href="${base}" style="color:#3b82f6;text-decoration:none;">Visit our store</a>
                        &nbsp;&#183;&nbsp;
                        <a href="${base}/track-order" style="color:#3b82f6;text-decoration:none;">Track Order</a>
                        &nbsp;&#183;&nbsp;
                        <a href="mailto:support@minihobbies.lk" style="color:#3b82f6;text-decoration:none;">Support</a>
                      </p>
                      <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
                        &copy; ${new Date().getFullYear()} Mini Hobbies. All rights reserved.
                      </p>
                      <p style="margin:3px 0 0;font-size:11px;color:#cbd5e1;">
                        This email was sent because you placed an order on Mini Hobbies.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
};

export default orderConfirmationHtml;
