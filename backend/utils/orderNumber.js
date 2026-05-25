import Order from "../models/Order.js";

export const generateOrderNumber = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `MH${datePart}`;
  const latest = await Order.findOne({ orderNumber: new RegExp(`^${prefix}`) })
    .sort("-orderNumber")
    .select("orderNumber")
    .lean();

  let sequence = 1;
  if (latest?.orderNumber) {
    sequence = Number(latest.orderNumber.slice(prefix.length)) + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
};
