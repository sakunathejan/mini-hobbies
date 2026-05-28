import { AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const WarningBanner = ({ cases = [] }) => {
  if (!cases || cases.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800">Account Warning{cases.length > 1 ? "s" : ""}</p>
          <div className="mt-2 space-y-2">
            {cases.map((c) => (
              <div key={c._id} className="rounded-lg bg-white/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <StatusBadge status={c.severity} />
                  {c.moderatorName && <span className="text-xs text-gray-500">By: {c.moderatorName}</span>}
                </div>
                <p className="mt-1.5 text-amber-900">{c.reason}</p>
                {c.message && <p className="mt-1 text-xs text-amber-700">{c.message}</p>}
                {c.createdAt && (
                  <p className="mt-1 text-xs text-amber-600">{new Date(c.createdAt).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-600">Further violations may result in account suspension or permanent ban.</p>
        </div>
      </div>
    </div>
  );
};

export default WarningBanner;
