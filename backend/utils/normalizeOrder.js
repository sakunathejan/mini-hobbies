const STATUS_MAP = {
  "pending advance payment": "Pending Advance Payment",
  "pending payment verification": "Pending Payment Verification",
  "payment confirmed": "Payment Confirmed",
  "advance payment submitted": "Advance Payment Submitted",
  "advance payment confirmed": "Advance Payment Confirmed",
  "awaiting final payment": "Awaiting Final Payment",
  "fully paid": "Fully Paid",
  "preparing order": "Preparing Order",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export const toTitleStatus = (status = "Pending Advance Payment") => {
  const key = String(status).trim().toLowerCase();
  return STATUS_MAP[key] || key
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const normalizeItems = (items = []) =>
  items.map((item) => ({
    product: item.product,
    name: item.name || "Product",
    image: item.image || "",
    price: Number(item.price ?? item.unitPrice ?? 0),
    quantity: Number(item.quantity || 1),
    variantName: item.variantName || ""
  }));

export const normalizeOrder = (order) => {
  const doc = order?.toObject ? order.toObject() : { ...order };
  const items = normalizeItems(doc.items);
  const subtotal = Number(doc.subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const deliveryFee = Number(doc.deliveryFee ?? 0);
  const total = Number(doc.total ?? subtotal + deliveryFee);
  const status = toTitleStatus(doc.status);

  const customer = doc.customer?.name
    ? {
        name: doc.customer.name,
        email: doc.customer.email || "",
        phone: doc.customer.phone || "",
        address: doc.customer.address || "",
        district: doc.customer.district || ""
      }
    : {
        name: doc.customerName || "",
        email: doc.customerEmail || "",
        phone: doc.phone || "",
        address: typeof doc.shippingAddress === "string" ? doc.shippingAddress : "",
        district: doc.district || ""
      };

  const statusHistory =
    doc.statusHistory?.length > 0
      ? doc.statusHistory.map((entry) => ({
          status: toTitleStatus(entry.status),
          note: entry.note || "",
          updatedAt: entry.updatedAt || doc.updatedAt || doc.createdAt
        }))
      : [{ status, note: "Order placed", updatedAt: doc.createdAt }];

  return {
    _id: doc._id,
    orderNumber: doc.orderNumber || `ORDER-${String(doc._id).slice(-6).toUpperCase()}`,
    customer,
    items,
    subtotal,
    deliveryFee,
    discount: Number(doc.discount || 0),
    total,
    advanceAmount: Number(doc.advanceAmount || 0),
    remainingBalance: Number(doc.remainingBalance || 0),
    partialPayments: doc.partialPayments || [],
    fullyPaidAt: doc.fullyPaidAt || null,
    paymentMethod: doc.paymentMethod || "",
    payment: doc.payment || null,
    coupon: doc.coupon || null,
    trackingNumber: doc.trackingNumber || "",
    status,
    statusHistory,
    notes: doc.notes || "",
    whatsappMessageId: doc.whatsappMessageId || "",
    whatsappStatus: doc.whatsappStatus || "",
    whatsappSentAt: doc.whatsappSentAt || null,
    whatsappErrorLog: doc.whatsappErrorLog || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};
