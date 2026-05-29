import { memo } from "react";

const styles = {
  "Pending Advance Payment": "bg-amber-50 text-amber-800",
  "Pending Payment Verification": "bg-purple-50 text-purple-800",
  "Advance Payment Submitted": "bg-purple-50 text-purple-800",
  "Fully Paid Pending Verification": "bg-orange-50 text-orange-800",
  "Payment Confirmed": "bg-emerald-50 text-emerald-800",
  "Advance Payment Confirmed": "bg-emerald-50 text-emerald-800",
  "Awaiting Final Payment": "bg-indigo-50 text-indigo-800",
  "Fully Paid": "bg-emerald-50 text-emerald-800",
  "Preparing Order": "bg-sky-50 text-sky-800",
  Shipped: "bg-blue-50 text-blue-800",
  Delivered: "bg-emerald-50 text-emerald-800",
  Cancelled: "bg-red-50 text-red-700"
};

const OrderStatusBadge = memo(({ status }) => {
  const value = String(status);
  const label = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[label] || styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
});

export default OrderStatusBadge;
