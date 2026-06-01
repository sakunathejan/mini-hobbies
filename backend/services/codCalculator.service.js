export function calculateCOD({ productValue, deliveryCharge }) {
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

  const codTotal = Math.round((pv + dc) * 100) / 100;

  return {
    success: true,
    productValue: pv,
    deliveryCharge: dc,
    codTotal
  };
}
