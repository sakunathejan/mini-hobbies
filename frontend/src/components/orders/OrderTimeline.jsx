import { memo, useMemo } from "react";
import { CheckCircle, Clock, CreditCard, Home, Package, Truck, Upload, XCircle } from "lucide-react";

const stepConfig = {
  "Pending Advance Payment": { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  "Advance Payment Submitted": { icon: Upload, color: "text-purple-600", bg: "bg-purple-100" },
  "Advance Payment Confirmed": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  "Pending Payment Verification": { icon: Clock, color: "text-purple-600", bg: "bg-purple-100" },
  "Payment Confirmed": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  "Awaiting Final Payment": { icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-100" },
  "Fully Paid": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  "Preparing Order": { icon: Package, color: "text-sky-600", bg: "bg-sky-100" },
  Shipped: { icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
  Delivered: { icon: Home, color: "text-emerald-600", bg: "bg-emerald-100" },
  Cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-100" }
};

const advanceSteps = [
  { label: "Pending Advance Payment", key: "Pending Advance Payment" },
  { label: "Advance Payment Submitted", key: "Advance Payment Submitted" },
  { label: "Advance Payment Confirmed", key: "Advance Payment Confirmed" },
  { label: "Awaiting Final Payment", key: "Awaiting Final Payment" },
  { label: "Fully Paid", key: "Fully Paid" },
  { label: "Preparing Order", key: "Preparing Order" },
  { label: "Shipped", key: "Shipped" },
  { label: "Delivered", key: "Delivered" }
];

const bankSteps = [
  { label: "Pending Payment Verification", key: "Pending Payment Verification" },
  { label: "Fully Paid", key: "Fully Paid" },
  { label: "Preparing Order", key: "Preparing Order" },
  { label: "Shipped", key: "Shipped" },
  { label: "Delivered", key: "Delivered" }
];

const codSteps = [
  { label: "Awaiting Final Payment", key: "Awaiting Final Payment" },
  { label: "Fully Paid", key: "Fully Paid" },
  { label: "Preparing Order", key: "Preparing Order" },
  { label: "Shipped", key: "Shipped" },
  { label: "Delivered", key: "Delivered" }
];

const OrderTimeline = memo(({ order }) => {
  const status = order.status;
  const method = order.paymentMethod;
  const history = order.statusHistory || [];

  if (status === "Cancelled") {
    const cancelEntry = history.find((h) => h.status === "Cancelled");
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-700">Order Cancelled</p>
            {cancelEntry && (
              <p className="mt-0.5 text-sm text-red-600">{new Date(cancelEntry.updatedAt).toLocaleString("en-LK")}</p>
            )}
          </div>
        </div>
        {cancelEntry?.note && <p className="mt-3 text-sm text-red-700">{cancelEntry.note}</p>}
      </div>
    );
  }

  const steps = method === "advance" ? advanceSteps : method === "bank_transfer" ? bankSteps : codSteps;
  const currentIndex = steps.findIndex((s) => s.key === status);

  const getDateForStatus = (statusKey) => {
    const entry = history.find((h) => h.status === statusKey);
    return entry ? new Date(entry.updatedAt).toLocaleString("en-LK") : null;
  };

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        const config = stepConfig[step.key];
        const Icon = config?.icon || Clock;
        const date = getDateForStatus(step.key);

        return (
          <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {index < steps.length - 1 && (
              <div className={`absolute left-[19px] top-10 w-0.5 -translate-x-1/2 ${done ? "bg-emerald-400" : "bg-gray-200"}`} style={{ height: "calc(100% - 2.5rem)" }} />
            )}
            <div className="relative shrink-0">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  active
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-200"
                    : done
                      ? "border-emerald-500 bg-emerald-100"
                      : "border-gray-300 bg-white"
                }`}
              >
                {done ? (
                  <CheckCircle className={`h-5 w-5 ${active ? "text-emerald-600" : "text-emerald-500"}`} />
                ) : (
                  <Icon className={`h-5 w-5 ${config?.color || "text-gray-400"}`} />
                )}
              </div>
              {active && (
                <span className="absolute -inset-1 animate-ping rounded-full bg-emerald-200 opacity-40" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1.5">
              <p className={`text-sm font-bold ${done ? "text-gray-950" : "text-gray-400"}`}>
                {step.label}
              </p>
              {date && (
                <p className="mt-0.5 text-xs text-gray-500">{date}</p>
              )}
              {active && (
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Current
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default OrderTimeline;
