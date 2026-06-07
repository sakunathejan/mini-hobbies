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

export const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateString;
  }
};

export const formatMonthYear = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  } catch {
    return dateString;
  }
};
