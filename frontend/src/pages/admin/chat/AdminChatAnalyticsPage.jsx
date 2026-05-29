import { useEffect, useState } from "react";
import { BarChart3, MessageCircle, TrendingUp, HelpCircle, ShoppingCart } from "lucide-react";
import { getChatAnalytics } from "../../../services/adminChatService.js";
import { formatCurrency } from "../../../utils/formatters.js";

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value ?? "—"}</p>
      </div>
    </div>
  </div>
);

const AdminChatAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getChatAnalytics({})
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-black">Chat Analytics</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="mt-2 h-6 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-black">Chat Analytics</h1>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Chat Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Deep insights into chatbot performance and customer behavior.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={MessageCircle} label="Total Sessions" value={data?.totalSessions} color="bg-blue-600" />
        <SummaryCard icon={BarChart3} label="Total Messages" value={data?.totalMessages} color="bg-purple-600" />
        <SummaryCard icon={HelpCircle} label="Unanswered" value={data?.unansweredQueries} color="bg-orange-600" />
        <SummaryCard icon={TrendingUp} label="Revenue Influenced" value={data?.chatRevenue ? formatCurrency(data.chatRevenue) : "Rs. 0"} color="bg-emerald-600" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold mb-4">Intent Distribution</h2>
          {data?.intentDistribution?.length > 0 ? (
            <div className="space-y-2">
              {data.intentDistribution.map((i, idx) => {
                const maxCount = data.intentDistribution[0]?.count || 1;
                const pct = ((i.count / maxCount) * 100).toFixed(0);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-medium capitalize text-gray-600">{i.intent}</span>
                    <div className="flex-1 rounded-full bg-gray-100 h-2.5">
                      <div className="h-2.5 rounded-full bg-amber-600" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs text-gray-500">{i.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No intent data yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold mb-4">Best Sellers in Chat</h2>
          {data?.bestSellersInChat?.length > 0 ? (
            <div className="space-y-2">
              {data.bestSellersInChat.slice(0, 10).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="truncate flex-1">{p.name}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-gray-500">{p.shown} shown</span>
                    <span className="text-xs font-medium text-green-600">{p.clicks} clicks</span>
                    <span className="text-[10px] text-gray-400">{p.clickRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No product data yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold mb-4">Daily Chat Sessions</h2>
          {data?.dailyStats?.length > 0 ? (
            <div className="space-y-1">
              {data.dailyStats.slice(-14).map((d, idx) => {
                const maxSessions = Math.max(...data.dailyStats.map((s) => s.sessions), 1);
                const pct = (d.sessions / maxSessions) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0 text-gray-500">{d.date}</span>
                    <div className="flex-1 rounded-full bg-gray-100 h-4">
                      <div className="h-4 rounded-full bg-amber-600" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right font-medium">{d.sessions}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No daily data yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold mb-4">Top Clicked Products</h2>
          {data?.topClickedProducts?.length > 0 ? (
            <div className="space-y-2">
              {data.topClickedProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="truncate flex-1">{p.name}</span>
                  <span className="shrink-0 ml-3 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{p.clicks} clicks</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No clicked products yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatAnalyticsPage;
