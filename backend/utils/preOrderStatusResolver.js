const isPastDate = (dateVal) => {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  return !isNaN(d.getTime()) && new Date() > d;
};

export const getProductLifecycleStatus = (product) => {
  if (!product || product.productType !== "PRE_ORDER") return "IN_STOCK";

  if (product.preOrderStatus === "PRE_ORDER_CANCELLED") return "PRE_ORDER_CANCELLED";
  if (product.preOrderStatus === "IN_STOCK") return "IN_STOCK";
  if (product.preOrderStatus === "PRE_ORDER_ARRIVED") return "IN_STOCK";

  if (isPastDate(product.preOrderDeadline)) return "PRE_ORDER_CLOSED";

  if (product.preOrderStatus === "PRE_ORDER_DELAYED") return "PRE_ORDER_DELAYED";

  return "PRE_ORDER_ACTIVE";
};
