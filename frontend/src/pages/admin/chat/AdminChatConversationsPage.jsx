import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Search, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../../../components/ui/Pagination.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { getConversations, exportConversations } from "../../../services/adminChatService.js";

const STATUS_BADGES = {
  active: "bg-green-100 text-green-700",
  resolved: "bg-blue-100 text-blue-700",
  abandoned: "bg-gray-100 text-gray-600"
};

const AdminChatConversationsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getConversations({ page, limit: 20, search, status });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportConversations({ format: "csv" });
      toast.success("Conversations exported.");
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const items = data?.conversations || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Conversations</h1>
          <p className="mt-1 text-sm text-gray-600">{data?.total || 0} total sessions</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {["all", "active", "resolved", "abandoned"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${status === s ? "bg-amber-800 text-white" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="mt-6"><EmptyState title="No conversations" message="No chats match your filters." /></div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-6 space-y-3">
          {items.map((c) => (
            <Link
              key={c._id}
              to={`/admin/chat/conversations/${c.sessionId}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-amber-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {c.customer?.name || "Guest"} — {c.sessionId?.slice(0, 16)}...
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_BADGES[c.status] || STATUS_BADGES.active}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.lastMessage && (
                    <p className="mt-1 truncate text-xs text-gray-500">{c.lastMessage}</p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-gray-400">
                  <p>{c.totalMessages} msgs</p>
                  {c.clickedProducts > 0 && <p className="text-amber-600">{c.clickedProducts} clicks</p>}
                </div>
              </div>
            </Link>
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

export default AdminChatConversationsPage;
