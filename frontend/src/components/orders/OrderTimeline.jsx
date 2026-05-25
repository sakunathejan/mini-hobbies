import OrderStatusBadge from "./OrderStatusBadge.jsx";

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
  { label: "Advance Payment Submitted", key: "Advance Payment Submitted" },
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

const OrderTimeline = ({ order }) => {
  const status = order.status;
  const method = order.paymentMethod;

  if (status === "Cancelled") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <OrderStatusBadge status="Cancelled" />
        <p className="mt-2 text-sm text-red-700">This order was cancelled.</p>
      </div>
    );
  }

  const steps = method === "advance" ? advanceSteps : method === "bank_transfer" ? bankSteps : codSteps;
  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {steps.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li
            key={step.key}
            className={`rounded-lg border p-4 ${done ? "border-ember/30 bg-ember/5" : "border-gray-200 bg-gray-50"}`}
          >
            <p className={`text-xs font-bold uppercase ${done ? "text-ember" : "text-gray-400"}`}>Step {index + 1}</p>
            <p className={`mt-1 font-bold ${done ? "text-gray-950" : "text-gray-500"}`}>{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
