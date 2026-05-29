import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Flag, CheckCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { getConversationDetail, resolveConversation, flagMessage } from "../../../services/adminChatService.js";
import { formatCurrency } from "../../../utils/formatters.js";

const AdminChatConversationDetailPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getConversationDetail(sessionId);
      setSession(s);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleResolve = async () => {
    try {
      await resolveConversation(sessionId);
      toast.success("Conversation resolved.");
      fetch();
    } catch { toast.error("Failed to resolve."); }
  };

  const handleFlag = async (messageId) => {
    try {
      await flagMessage(sessionId, messageId, "Flagged by admin");
      toast.success("Message flagged.");
      fetch();
    } catch { toast.error("Failed to flag."); }
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="h-8 w-64 rounded bg-gray-200" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link to="/admin/chat/conversations" className="inline-flex items-center gap-1 text-sm text-amber-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to conversations
        </Link>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div>
      <Link to="/admin/chat/conversations" className="inline-flex items-center gap-1 text-sm text-amber-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to conversations
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Conversation</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {session.sessionId} — {session.messages?.length || 0} messages
            {session.customer && <> — {session.customer.name}{session.customer.email ? ` (${session.customer.email})` : ""}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${session.status === "active" ? "bg-green-100 text-green-700" : session.status === "resolved" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
            {session.status}
          </span>
          {session.status !== "resolved" && (
            <button onClick={handleResolve} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-gray-50">
              <CheckCircle className="h-3.5 w-3.5" /> Resolve
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {session.messages?.map((msg, i) => (
          <div
            key={msg._id || i}
            className={`rounded-lg border p-4 text-sm ${msg.role === "user" ? "ml-12 border-gray-200 bg-white" : "mr-12 border-amber-200 bg-amber-50"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {msg.role === "user" ? "Customer" : "MiniBot"}
                  {msg.intent && <span className="ml-2 text-gray-300">intent: {msg.intent}</span>}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-gray-800">{msg.text}</p>

                {msg.products?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.products.map((p, pi) => (
                      <div key={pi} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-xs shadow-sm">
                        {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-gray-500">{p.price ? formatCurrency(p.price) : ""}</p>
                        </div>
                        {p.slug && (
                          <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {p.clicked && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Clicked</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "bot" && (
                <button
                  onClick={() => handleFlag(msg._id)}
                  className={`shrink-0 rounded p-1.5 transition ${msg.flagged ? "bg-red-100 text-red-600" : "text-gray-300 hover:text-red-500"}`}
                  title={msg.flagged ? "Flagged" : "Flag message"}
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="mt-2 text-[10px] text-gray-400">
              {new Date(msg.createdAt).toLocaleString("en-LK")}
              {msg.responseTimeMs ? ` • ${msg.responseTimeMs}ms` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminChatConversationDetailPage;
