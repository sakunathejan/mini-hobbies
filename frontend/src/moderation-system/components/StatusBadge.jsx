const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  warned: "bg-amber-100 text-amber-700",
  suspended: "bg-orange-100 text-orange-700",
  banned: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600",
  lifted: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  suspension: "bg-orange-100 text-orange-700",
  ban: "bg-red-100 text-red-700",
  none: "bg-gray-100 text-gray-500",
};

const StatusBadge = ({ status = "active" }) => {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
    </span>
  );
};

export default StatusBadge;
