import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModerationTimeline from "../components/ModerationTimeline.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getMyModerationHistory } from "../services/moderationService.js";

const ModerationHistoryPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyModerationHistory()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Moderation History</h1>
        <StatusBadge status={data?.moderationStatus || "active"} />
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <ModerationTimeline cases={data?.cases || []} />
      </div>
    </div>
  );
};

export default ModerationHistoryPage;
