export const formatCurrency = (value) => {
  const num = Number(value || 0);
  if (isNaN(num)) return "Rs. 0";
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0
    }).format(num);
  } catch {
    return "Rs. " + num.toLocaleString();
  }
};
