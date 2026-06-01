const PREPAID_METHODS = new Set([
  "online_payment", "bank_transfer", "card", "advance"
]);

const COD_METHOD = "cod";
const PAID_STATUS = "paid";

function canonicalMethod(method) {
  if (!method) return "";
  return method.toLowerCase().trim();
}

export function calculateCOD(order) {
  if (!order) {
    return { success: false, error: "Order is required" };
  }

  const items = order.items || [];
  const productValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const deliveryCharge = order.deliveryFee || 0;
  const paymentMethod = canonicalMethod(order.paymentMethod);
  const paymentStatus = (order.paymentStatus || "pending").toLowerCase();
  const paymentType = (order.paymentType || "").toLowerCase();
  const status = (order.status || "").toLowerCase();

  const pv = Math.round(parseFloat(productValue) * 100) / 100;
  const dc = Math.round(parseFloat(deliveryCharge) * 100) / 100;

  if (isNaN(pv) || pv < 0) {
    return { success: false, error: "Invalid product value" };
  }
  if (isNaN(dc) || dc < 0) {
    return { success: false, error: "Invalid delivery charge" };
  }

  const totalAmount = Math.round((pv + dc) * 100) / 100;

  const paidStatus = paymentStatus === PAID_STATUS;
  const paidLegacyStatus = ["fully paid", "payment confirmed", "fully paid pending verification", "advance payment confirmed"].includes(status);
  const prepaidMethod = PREPAID_METHODS.has(paymentMethod);
  const prepaidType = ["online_payment", "card", "full_payment"].includes(paymentType);

  const isCOD =
    !paidStatus &&
    !paidLegacyStatus &&
    paymentMethod === COD_METHOD &&
    !prepaidMethod &&
    !prepaidType;

  const alreadyPaid = !isCOD;
  const codAmount = alreadyPaid ? 0 : totalAmount;
  const getCod = codAmount;

  console.log(`[COD] Order ${order.orderNumber || order._id}: method=${paymentMethod} status=${paymentStatus} type=${paymentType} legacyStatus=${order.status} => isCOD=${isCOD} alreadyPaid=${alreadyPaid} codAmount=${codAmount}`);

  return {
    success: true,
    productValue: pv,
    deliveryCharge: dc,
    totalAmount,
    codAmount,
    getCod,
    paymentMethod,
    paymentStatus,
    paymentType,
    alreadyPaid
  };
}

export function getPaymentSummary(order) {
  const result = calculateCOD(order);
  if (!result.success) return result;

  return {
    success: true,
    total: result.totalAmount,
    productValue: result.productValue,
    deliveryCharge: result.deliveryCharge,
    payNow: result.alreadyPaid ? result.totalAmount : 0,
    payOnDelivery: result.alreadyPaid ? 0 : result.totalAmount,
    paymentMethod: result.paymentMethod,
    paymentStatus: result.paymentStatus,
    codAmount: result.codAmount
  };
}
