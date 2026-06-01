const BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  warned: "bg-amber-100 text-amber-700",
  suspended: "bg-orange-100 text-orange-700",
  banned: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600",
  appealed: "bg-blue-100 text-blue-700",
  lifted: "bg-gray-100 text-gray-600",
};

const LABELS = {
  active: "Active",
  warned: "Warned",
  suspended: "Suspended",
  banned: "Banned",
  expired: "Expired",
  appealed: "Appealed",
  lifted: "Lifted",
};

export default function StatusBadge({ status = "active", size = "sm" }) {
  const cls = BADGE[status] || BADGE.active;
  const sizeCls = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${cls} ${sizeCls}`}>
      {LABELS[status] || status}
    </span>
  );
}
