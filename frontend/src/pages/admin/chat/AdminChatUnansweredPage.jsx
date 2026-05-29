import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Search, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../../../components/ui/Pagination.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { getUnansweredQueries, resolveUnansweredQuery, createKnowledgeEntry } from "../../../services/adminChatService.js";

const AdminChatUnansweredPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resolved, setResolved] = useState("false");
  const [resolving, setResolving] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUnansweredQueries({ page, limit: 20, search, resolved });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  }, [page, search, resolved]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResolve = async (query) => {
    setResolving(query._id);
    try {
      await createKnowledgeEntry({
        question: query.question,
        answer: query.question,
        category: "faq",
        tags: ["from_unanswered"],
        priority: 0
      });
      await resolveUnansweredQuery(query._id, { type: "knowledge", answer: query.question });
      toast.success("Query resolved. Please edit the answer in Knowledge Base.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve.");
    } finally {
      setResolving(null);
    }
  };

  const queries = data?.queries || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Unanswered Queries</h1>
          <p className="mt-1 text-sm text-gray-600">{data?.total || 0} questions the chatbot couldn't answer.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {["false", "true", "all"].map((v) => (
            <button
              key={v}
              onClick={() => { setResolved(v); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${resolved === v ? "bg-amber-800 text-white" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {v === "false" ? "Unresolved" : v === "true" ? "Resolved" : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && queries.length === 0 && (
        <div className="mt-6"><EmptyState title="No unanswered queries" message="All questions are being handled!" /></div>
      )}

      {!loading && !error && queries.length > 0 && (
        <div className="mt-6 space-y-2">
          {queries.map((q) => (
            <div key={q._id} className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                    {q.resolved && <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>Asked {q.count}x</span>
                    <span>Last: {new Date(q.lastAskedAt).toLocaleDateString("en-LK")}</span>
                  </div>
                  {q.resolution?.answer && (
                    <p className="mt-2 rounded bg-green-50 px-3 py-1.5 text-xs text-green-700">
                      Resolved: {q.resolution.answer}
                    </p>
                  )}
                </div>
                {!q.resolved && (
                  <button
                    onClick={() => handleResolve(q)}
                    disabled={resolving === q._id}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {resolving === q._id ? "..." : "Resolve"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default AdminChatUnansweredPage;
