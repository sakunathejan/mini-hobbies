const PAYMENT_METHODS = {
  COD: "cod",
  ONLINE_PAYMENT: "online_payment"
};

export function calculateCOD({ productValue, deliveryCharge, paymentMethod }) {
  if (productValue === undefined || productValue === null) {
    return { success: false, error: "productValue is required" };
  }
  if (deliveryCharge === undefined || deliveryCharge === null) {
    return { success: false, error: "deliveryCharge is required" };
  }

  const pv = Math.round(parseFloat(productValue) * 100) / 100;
  const dc = Math.round(parseFloat(deliveryCharge) * 100) / 100;

  if (isNaN(pv) || pv < 0) {
    return { success: false, error: "Invalid product value" };
  }
  if (isNaN(dc) || dc < 0) {
    return { success: false, error: "Invalid delivery charge" };
  }

  const isCOD = paymentMethod === PAYMENT_METHODS.COD;
  const codAmount = isCOD ? Math.round((pv + dc) * 100) / 100 : 0;
  const getCod = isCOD ? codAmount : 0;

  return {
    success: true,
    productValue: pv,
    deliveryCharge: dc,
    codAmount,
    getCod,
    paymentMethod: isCOD ? PAYMENT_METHODS.COD : PAYMENT_METHODS.ONLINE_PAYMENT
  };
}

export function getPaymentSummary({ productValue, deliveryCharge, paymentMethod }) {
  const total = Math.round((parseFloat(productValue || 0) + parseFloat(deliveryCharge || 0)) * 100) / 100;
  const isCOD = paymentMethod === PAYMENT_METHODS.COD;
  return {
    total,
    payNow: isCOD ? 0 : total,
    payOnDelivery: isCOD ? total : 0,
    paymentMethod: isCOD ? "Cash on Delivery" : "Online Payment"
  };
}
