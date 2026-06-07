import Product from "../models/Product.js";
import { getProductLifecycleStatus } from "../utils/preOrderStatusResolver.js";

const VALID_TRANSITIONS = {
  "PRE_ORDER_ACTIVE":   ["PRE_ORDER_CLOSED", "PRE_ORDER_CANCELLED"],
  "PRE_ORDER_CLOSED":   ["PRE_ORDER_DELAYED", "PRE_ORDER_ARRIVED", "PRE_ORDER_CANCELLED"],
  "PRE_ORDER_DELAYED":  ["PRE_ORDER_CLOSED", "PRE_ORDER_ARRIVED", "PRE_ORDER_CANCELLED"],
  "PRE_ORDER_ARRIVED":  ["IN_STOCK", "PRE_ORDER_CANCELLED"],
  "PRE_ORDER_CANCELLED": [],
  "IN_STOCK":           []
};

export const transitionPreOrder = async (productId, toState, { trigger = "admin", note = "" } = {}) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found.");

  if (product.preOrderStatus === "IN_STOCK") {
    throw new Error("Cannot transition a product that has already been converted to IN_STOCK.");
  }
  if (product.preOrderStatus === "PRE_ORDER_CANCELLED") {
    throw new Error("Cannot transition a cancelled pre-order.");
  }

  const fromState = product.preOrderStatus || "PRE_ORDER_ACTIVE";
  if (fromState === toState) return { product, transitioned: false, reason: "Already in target state." };

  const allowed = VALID_TRANSITIONS[fromState] || [];
  if (!allowed.includes(toState)) {
    throw new Error(`Transition from ${fromState} to ${toState} is not allowed.`);
  }

  if (toState === "PRE_ORDER_ARRIVED" && fromState !== "PRE_ORDER_CLOSED" && fromState !== "PRE_ORDER_DELAYED") {
    throw new Error(`Cannot mark as arrived from ${fromState}. Must be PRE_ORDER_CLOSED or PRE_ORDER_DELAYED.`);
  }
  if (toState === "IN_STOCK" && fromState !== "PRE_ORDER_ARRIVED") {
    throw new Error(`Cannot convert to stock from ${fromState}. Must be PRE_ORDER_ARRIVED.`);
  }

  const now = new Date();
  if (toState === "PRE_ORDER_CLOSED") product.preOrderClosedAt = now;
  if (toState === "PRE_ORDER_ARRIVED") product.preOrderArrivedAt = now;
  if (toState === "PRE_ORDER_CANCELLED") product.preOrderCancelledAt = now;
  if (toState === "PRE_ORDER_DELAYED") product.preOrderDelayedAt = now;

  product.preOrderStatus = toState;

  if (toState === "IN_STOCK") {
    product.productType = "IN_STOCK";
    product.isPreOrder = false;
  }

  if (!product.preOrderLog) product.preOrderLog = [];
  product.preOrderLog.push({
    from: fromState,
    to: toState,
    trigger,
    note,
    timestamp: now
  });

  await product.save();

  console.log(`[PRE-ORDER] ${product.name} (${productId}): ${fromState} → ${toState} via ${trigger}${note ? ` — ${note}` : ""}`);

  return { product, transitioned: true };
};

export const getPreOrderAnalytics = async () => {
  const [active, closed, delayed, arrived, cancelled, converted] = await Promise.all([
    Product.countDocuments({ productType: "PRE_ORDER", preOrderStatus: "PRE_ORDER_ACTIVE" }),
    Product.countDocuments({ productType: "PRE_ORDER", preOrderStatus: "PRE_ORDER_CLOSED" }),
    Product.countDocuments({ productType: "PRE_ORDER", preOrderStatus: "PRE_ORDER_DELAYED" }),
    Product.countDocuments({ productType: "PRE_ORDER", preOrderStatus: "PRE_ORDER_ARRIVED" }),
    Product.countDocuments({ productType: "PRE_ORDER", preOrderStatus: "PRE_ORDER_CANCELLED" }),
    Product.countDocuments({ preOrderStatus: "IN_STOCK" })
  ]);

  const total = active + closed + delayed + arrived + cancelled + converted;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return { active, closed, delayed, arrived, cancelled, converted, conversionRate, total };
};

export const getComputedPreOrderAnalytics = async () => {
  const products = await Product.find({ productType: "PRE_ORDER" }).lean();

  const counts = { active: 0, closed: 0, delayed: 0, arrived: 0, cancelled: 0, converted: 0 };

  for (const product of products) {
    const status = getProductLifecycleStatus(product);
    switch (status) {
      case "PRE_ORDER_ACTIVE":   counts.active++; break;
      case "PRE_ORDER_CLOSED":   counts.closed++; break;
      case "PRE_ORDER_DELAYED":  counts.delayed++; break;
      case "PRE_ORDER_CANCELLED": counts.cancelled++; break;
      case "IN_STOCK":           counts.converted++; break;
      default:                   counts.active++; break;
    }
  }

  const total = counts.active + counts.closed + counts.delayed + counts.arrived + counts.cancelled + counts.converted;
  const conversionRate = total > 0 ? Math.round((counts.converted / total) * 100) : 0;

  return { ...counts, conversionRate, total };
};
