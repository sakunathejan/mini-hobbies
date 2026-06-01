import { Ban, Clock, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const TYPE_ICON = {
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  suspension: { icon: Clock, color: "text-orange-500" },
  ban: { icon: Ban, color: "text-red-500" },
};

const TYPE_LABEL = {
  warning: "Warning",
  suspension: "Suspension",
  ban: "Ban",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ModerationTimeline({ cases = [] }) {
  if (!cases || cases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
        <Shield className="h-8 w-8" />
        <p className="text-sm">No moderation history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((c, i) => {
        const IconInfo = TYPE_ICON[c.type] || TYPE_ICON.warning;
        const Icon = IconInfo.icon;
        return (
          <div key={c._id} className="relative pl-8">
            {i < cases.length - 1 && (
              <div className="absolute left-3.5 top-8 bottom-0 w-px bg-gray-200" />
            )}
            <div className={`absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white ring-2 ring-gray-100 ${IconInfo.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{TYPE_LABEL[c.type] || c.type}</span>
                  <StatusBadge status={c.status} />
                </div>
                <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-700">{c.reason}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {c.issuedByName && <span>By: {c.issuedByName}</span>}
                {c.duration && <span>Duration: {c.duration}h</span>}
                {c.expiresAt && <span>Expires: {formatDate(c.expiresAt)}</span>}
                {c.resolvedAt && c.status !== "active" && <span>Resolved: {formatDate(c.resolvedAt)}</span>}
              </div>
              {c.appealed && (
                <div className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
                  <p className="font-semibold">Appeal {c.status === "appealed" ? "Pending" : c.status === "lifted" ? "Accepted" : "Denied"}</p>
                  {c.appealMessage && <p className="mt-0.5">Your message: {c.appealMessage}</p>}
                  {c.appealResponse && <p className="mt-0.5">Response: {c.appealResponse}</p>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
