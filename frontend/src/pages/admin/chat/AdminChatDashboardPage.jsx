import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, MessageCircle, Users, ShoppingCart, TrendingUp, HelpCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters.js";
import { getChatDashboard } from "../../../services/adminChatService.js";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value ?? "—"}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </div>
);

const AdminChatDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getChatDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-black">Chatbot Dashboard</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-5">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-black">Chatbot Dashboard</h1>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Chatbot Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">AI assistant performance and activity overview.</p>
        </div>
        <Link
          to="/admin/chat/analytics"
          className="flex items-center gap-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900"
        >
          <BarChart3 className="h-4 w-4" />
          Full Analytics
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MessageCircle} label="Today's Chats" value={data?.todayChats} color="bg-blue-600" />
        <StatCard icon={Users} label="Active Sessions" value={data?.activeSessions} color="bg-green-600" />
        <StatCard icon={ShoppingCart} label="Chat → Orders" value={data?.chatInfluencedOrders} sub={`${data?.conversionRate || 0}% conversion`} color="bg-amber-700" />
        <StatCard icon={TrendingUp} label="Chat Revenue" value={data?.chatRevenue ? formatCurrency(data.chatRevenue) : "Rs. 0"} color="bg-emerald-600" />
        <StatCard icon={HelpCircle} label="Unanswered Queries" value={data?.unansweredQueries} color="bg-orange-600" />
        <StatCard icon={BarChart3} label="Total Sessions" value={data?.totalSessions} color="bg-purple-600" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold">Top Unanswered Queries</h2>
          {data?.topQueries?.length > 0 ? (
            <div className="mt-4 space-y-2">
              {data.topQueries.slice(0, 5).map((q, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="truncate text-gray-700">{q.question}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">{q.count}x</span>
                </div>
              ))}
              <Link to="/admin/chat/unanswered" className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline">
                View all <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No unanswered queries. All questions are being handled! 🎉</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold">Top Clicked Products in Chat</h2>
          {data?.topClickedProducts?.length > 0 ? (
            <div className="mt-4 space-y-2">
              {data.topClickedProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="truncate text-gray-700">{p.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{p.clicks} clicks</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No product clicks recorded yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/chat/conversations" className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm">
          <MessageCircle className="h-5 w-5 text-amber-700" />
          <h3 className="mt-2 font-semibold">Monitor Conversations</h3>
          <p className="mt-1 text-xs text-gray-500">View live and past customer chats.</p>
        </Link>
        <Link to="/admin/chat/knowledge" className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm">
          <HelpCircle className="h-5 w-5 text-amber-700" />
          <h3 className="mt-2 font-semibold">Knowledge Base</h3>
          <p className="mt-1 text-xs text-gray-500">Manage FAQs, policies, and chatbot answers.</p>
        </Link>
        <Link to="/admin/chat/config" className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm">
          <BarChart3 className="h-5 w-5 text-amber-700" />
          <h3 className="mt-2 font-semibold">Settings & Testing</h3>
          <p className="mt-1 text-xs text-gray-500">Configure behavior, test responses, train the bot.</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminChatDashboardPage;
