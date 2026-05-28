import { AlertTriangle, Ban, Clock, ShieldOff, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const TYPE_ICONS = {
  warning: AlertTriangle,
  suspension: Clock,
  ban: Ban,
  expired: RotateCcw,
  lifted: ShieldOff,
};

const ModerationTimeline = ({ cases = [] }) => {
  if (cases.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">No moderation history.</p>;
  }

  return (
    <div className="relative space-y-0">
      {cases.map((c, i) => {
        const Icon = TYPE_ICONS[c.type] || AlertTriangle;
        const isLast = i === cases.length - 1;

        return (
          <div key={c._id} className="relative flex gap-4 pb-6">
            {!isLast && <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gray-200" />}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 capitalize">{c.type}</span>
                <StatusBadge status={c.status} />
                {c.severity && <StatusBadge status={c.severity} />}
                {c.createdAt && (
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("en-LK")}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">{c.reason}</p>
              {c.message && <p className="mt-0.5 text-xs text-gray-500">{c.message}</p>}
              {c.moderator?.name && <p className="mt-0.5 text-xs text-gray-400">By: {c.moderator.name}</p>}
              {c.endAt && (
                <p className="mt-0.5 text-xs text-gray-400">Ends: {new Date(c.endAt).toLocaleDateString("en-LK")}</p>
              )}
              {c.appealStatus && c.appealStatus !== "none" && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    {c.appealStatus === "approved" ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> :
                     c.appealStatus === "rejected" ? <XCircle className="h-3.5 w-3.5 text-red-600" /> :
                     <Clock className="h-3.5 w-3.5 text-yellow-600" />}
                    <span className={
                      c.appealStatus === "approved" ? "font-semibold text-green-700" :
                      c.appealStatus === "rejected" ? "font-semibold text-red-700" : "font-semibold text-yellow-700"
                    }>
                      Appeal {c.appealStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  {c.appealMessage && <p className="mt-1.5 text-gray-600 italic">"{c.appealMessage}"</p>}
                  {c.appealReviewNotes && (
                    <p className="mt-1 text-gray-500">Review note: {c.appealReviewNotes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModerationTimeline;
