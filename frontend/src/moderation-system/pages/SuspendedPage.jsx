import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Ban, Clock } from "lucide-react";
import { getMyModerationStatus } from "../services/moderationService.js";

const SuspendedPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    getMyModerationStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!status?.case?.endAt || status.status !== "suspended") return;
    const end = new Date(status.case.endAt).getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      if (diff <= 0) { setCountdown("Expired — refreshing..."); getMyModerationStatus().then(setStatus).catch(() => {}); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [status]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const isBanned = status?.status === "banned";
  const c = status?.case;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isBanned ? "bg-red-100" : "bg-orange-100"}`}>
          {isBanned ? <Ban className="h-10 w-10 text-red-600" /> : <Clock className="h-10 w-10 text-orange-600" />}
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          {isBanned ? "Account Banned" : "Account Suspended"}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {isBanned
            ? "This account has been permanently banned."
            : "Your account is temporarily suspended."}
        </p>

        {c && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Reason</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{c.reason}</p>
            {c.message && <p className="mt-1 text-xs text-gray-500">{c.message}</p>}
            {countdown && (
              <p className="mt-3 text-center text-lg font-bold text-orange-600">{countdown}</p>
            )}
            {c.endAt && (
              <p className="mt-1 text-xs text-gray-400">Suspended until: {new Date(c.endAt).toLocaleDateString()}</p>
            )}
            {c.createdAt && (
              <p className="mt-0.5 text-xs text-gray-400">Date: {new Date(c.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Link to="/account/appeal" className="btn-primary inline-flex w-full items-center justify-center gap-2">
            Submit an Appeal
          </Link>
          <p className="text-xs text-gray-400">Explain why you believe this decision should be reconsidered.</p>
        </div>
      </div>
    </div>
  );
};

export default SuspendedPage;
