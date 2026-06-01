import { AlertTriangle, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function WarningBanner({ cases = [], onDismiss }) {
  if (!cases || cases.length === 0) return null;

  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <div key={c._id} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="font-semibold">Warning Issued</p>
            <p className="mt-0.5 text-amber-700">{c.reason}</p>
          </div>
          {onDismiss && (
            <button type="button" onClick={() => onDismiss(c._id)} className="shrink-0 text-amber-400 hover:text-amber-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <Link to="/account/moderation" className="shrink-0 text-xs font-semibold text-amber-700 underline hover:no-underline">
            Details
          </Link>
        </div>
      ))}
    </div>
  );
}
