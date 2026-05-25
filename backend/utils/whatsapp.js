export const normalizePhone = (phone = "") => phone.replace(/\D/g, "");

const toInternationalPhone = (phone) => {
  const digits = normalizePhone(phone);
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return `94${digits}`;
};

export const formatOrderWhatsAppMessage = (order) => {
  const lines = [
    "New Mini Hobbies Order",
    `Order: ${order.orderNumber}`,
    `Status: ${order.status}`,
    "",
    "Customer",
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Email: ${order.customer.email}`,
    `Address: ${order.customer.address}`,
    "",
    "Items"
  ];

  order.items.forEach((item) => {
    lines.push(`- ${item.name} x${item.quantity} — LKR ${(item.price * item.quantity).toLocaleString("en-LK")}`);
  });

  const methodLabels = { bank_transfer: "Bank Transfer", cod: "Cash on Delivery", advance: "50% Advance" };
  const statusLabels = {
    "Pending Advance Payment": "Pending Advance Payment",
    "Pending Payment Verification": "Pending Payment Verification",
    "Payment Confirmed": "Payment Confirmed",
    "Advance Payment Submitted": "Advance Payment Submitted",
    "Advance Payment Confirmed": "Advance Payment Confirmed",
    "Awaiting Final Payment": "Awaiting Final Payment",
    "Fully Paid": "Fully Paid",
    "Preparing Order": "Preparing Order",
    Shipped: "Shipped",
    Delivered: "Delivered",
    Cancelled: "Cancelled"
  };
  lines.push("", `Payment: ${methodLabels[order.paymentMethod] || order.paymentMethod || "N/A"}`);

  if (order.discount > 0) {
    lines.push(`Discount: -LKR ${order.discount.toLocaleString("en-LK")}`);
  }

  lines.push(
    "",
    `Subtotal: LKR ${order.subtotal.toLocaleString("en-LK")}`,
    `Delivery: LKR ${order.deliveryFee.toLocaleString("en-LK")}`,
    `Total: LKR ${order.total.toLocaleString("en-LK")}`
  );

  if (order.notes) {
    lines.push("", `Notes: ${order.notes}`);
  }

  return lines.join("\n");
};

export const buildWhatsAppUrl = (phone, text) => {
  const storePhone = toInternationalPhone(phone);
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
};

export const notifyAdminWhatsApp = async (order) => {
  const storePhone = process.env.WHATSAPP_STORE_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const message = formatOrderWhatsAppMessage(order);
  const whatsappUrl = storePhone ? buildWhatsAppUrl(storePhone, message) : null;

  let adminNotified = false;

  if (storePhone && apiKey) {
    try {
      const url = new URL("https://api.callmebot.com/whatsapp.php");
      url.searchParams.set("phone", toInternationalPhone(storePhone));
      url.searchParams.set("text", message);
      url.searchParams.set("apikey", apiKey);

      const response = await fetch(url);
      adminNotified = response.ok;
    } catch {
      adminNotified = false;
    }
  }

  return { whatsappUrl, adminNotified };
};
