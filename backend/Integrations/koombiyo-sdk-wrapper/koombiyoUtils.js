export function sanitizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "").replace(/^0/, "94");
}

export function buildOrderRequest(order) {
  const customer = order.customer || {};
  const items = order.items || [];

  const description = items
    .slice(0, 5)
    .map((i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity}`)
    .join(", ");

  if (items.length > 5) {
    const rest = items.length - 5;
    description += ` +${rest} more item(s)`;
  }

  return {
    receiver_name: customer.name || "",
    receiver_address: customer.address || "",
    receiver_phone: sanitizePhone(customer.phone),
    district: (customer.district || "").trim(),
    item_description: description,
    item_count: items.reduce((sum, i) => sum + i.quantity, 0),
    order_value: Math.round(order.total || 0),
    order_id: order.orderNumber || String(order._id),
    delivery_note: order.notes || "",
  };
}

export function sanitizeOrderForResponse(order) {
  const delivery = order.delivery || {};
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    advanceAmount: order.advanceAmount,
    remainingBalance: order.remainingBalance,
    paymentMethod: order.paymentMethod,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    items: order.items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    payment: order.payment,
    delivery: delivery.shipmentCreated
      ? {
          provider: delivery.provider,
          waybillId: delivery.waybillId,
          trackingUrl: delivery.trackingUrl,
          deliveryStatus: delivery.deliveryStatus,
          shipmentCreated: true,
          history: delivery.history,
        }
      : order.delivery || { shipmentCreated: false },
  };
}

export function mapKoombiyoStatus(status) {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s.includes("delivered") || s.includes("client")) return "delivered";
  if (s.includes("out for delivery") || s.includes("dispatched")) return "in_transit";
  if (s.includes("warehouse") || s.includes("destination")) return "in_transit";
  if (s.includes("collected") || s.includes("processing")) return "processing";
  if (s.includes("cancelled") || s.includes("return")) return "returned";
  return "pending";
}
