import { useState, useEffect, useCallback } from "react";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../moderation/StatusBadge.jsx";
import WarningBanner from "../moderation/WarningBanner.jsx";
import ModerationTimeline from "../moderation/ModerationTimeline.jsx";
import { getMyModerationStatus, getMyHistory } from "../moderation/moderationService.js";
import Pagination from "../components/ui/Pagination.jsx";

const CustomerModerationPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMyModerationStatus()
      .then((s) => {
        setStatus(s.status);
        setWarnings(s.warnings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchHistory = useCallback(async (p) => {
    setHistoryLoading(true);
    try {
      const result = await getMyHistory({ page: p });
      setHistory(result);
    } catch {} finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(page); }, [fetchHistory, page]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const accountLabel = status === "banned" ? "Banned" : status === "suspended" ? "Suspended" : "Active";
  const accountColor = status === "banned" ? "text-red-600" : status === "suspended" ? "text-orange-600" : "text-emerald-600";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Moderation History</h1>
        <StatusBadge status={status || "active"} />
      </div>

      <div className="mt-4">
        <WarningBanner cases={warnings} />
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <ModerationTimeline cases={history?.cases || []} />
        )}
      </div>

      {history?.pagination?.pages > 1 && (
        <div className="mt-4">
          <Pagination current={page} total={history.pagination.pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default CustomerModerationPage;
