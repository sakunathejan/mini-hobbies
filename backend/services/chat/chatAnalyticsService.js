import ChatSession from "../../models/chat/ChatSession.js";
import ChatUnansweredQuery from "../../models/chat/ChatUnansweredQuery.js";
import Order from "../../models/Order.js";
import * as cache from "../../utils/cache.js";

const CACHE_TTL = 5 * 60 * 1000;

export const getDashboardStats = async () => {
  const cacheKey = "chat:admin:dashboard";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    todayChats,
    activeSessions,
    totalSessions,
    unansweredCount,
    topQueries,
    topProducts,
    conversionData
  ] = await Promise.all([
    ChatSession.countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
    ChatSession.countDocuments({ status: "active" }),
    ChatSession.countDocuments({ status: { $ne: "active" } }),
    ChatUnansweredQuery.countDocuments({ resolved: false }),
    ChatUnansweredQuery.aggregate([
      { $match: { resolved: false } },
      { $group: { _id: "$normalizedQuestion", question: { $first: "$question" }, totalCount: { $sum: "$count" } } },
      { $sort: { totalCount: -1 } },
      { $limit: 10 }
    ]),
    ChatSession.aggregate([
      { $unwind: "$messages" },
      { $unwind: "$messages.products" },
      { $match: { "messages.products.clicked": true } },
      { $group: { _id: "$messages.products.productId", name: { $first: "$messages.products.name" }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]),
    Order.aggregate([
      { $match: { notes: { $regex: /chatbot|mini.?bot|chat/i } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$total" }
        }
      }
    ])
  ]);

  const result = {
    todayChats,
    activeSessions,
    totalSessions,
    unansweredQueries: unansweredCount,
    topQueries: topQueries.map((q) => ({ question: q.question, count: q.totalCount })),
    topClickedProducts: topProducts.map((p) => ({ productId: p._id, name: p.name, clicks: p.clicks })),
    chatInfluencedOrders: conversionData[0]?.count || 0,
    chatRevenue: conversionData[0]?.total || 0,
    conversionRate: totalSessions > 0
      ? (((conversionData[0]?.count || 0) / totalSessions) * 100).toFixed(1)
      : "0.0"
  };

  cache.set(cacheKey, result, CACHE_TTL);
  return result;
};

export const getConversations = async ({ status, search, page = 1, limit = 20, sort = "-updatedAt" }) => {
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { sessionId: { $regex: search, $options: "i" } },
      { "messages.text": { $regex: search, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    ChatSession.find(filter)
      .select("sessionId customer status metadata.totalMessages metadata.clickedProducts createdAt updatedAt messages.text messages.intent messages.role messages.createdAt")
      .populate("customer", "name email phone")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ChatSession.countDocuments(filter)
  ]);

  return {
    conversations: items.map((s) => ({
      _id: s._id,
      sessionId: s.sessionId,
      customer: s.customer,
      status: s.status,
      totalMessages: s.metadata?.totalMessages || s.messages?.length || 0,
      clickedProducts: s.metadata?.clickedProducts || 0,
      lastMessage: s.messages?.[s.messages.length - 1]?.text || "",
      lastIntent: s.messages?.[s.messages.length - 1]?.intent || "",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getConversationDetail = async (sessionId) => {
  const session = await ChatSession.findOne({ sessionId })
    .populate("customer", "name email phone")
    .populate("messages.products.productId", "name slug price images")
    .lean();
  return session;
};

export const getAnalytics = async ({ startDate, endDate }) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [
    totalSessions,
    totalMessages,
    intentDistribution,
    productClicks,
    dailyStats,
    unanswered,
    bestSellers
  ] = await Promise.all([
    ChatSession.countDocuments(filter),
    ChatSession.aggregate([
      { $match: filter },
      { $project: { msgCount: { $size: "$messages" } } },
      { $group: { _id: null, total: { $sum: "$msgCount" } } }
    ]),
    ChatSession.aggregate([
      { $match: filter },
      { $unwind: "$messages" },
      { $match: { "messages.intent": { $ne: null } } },
      { $group: { _id: "$messages.intent", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    ChatSession.aggregate([
      { $match: filter },
      { $unwind: "$messages" },
      { $unwind: "$messages.products" },
      { $match: { "messages.products.clicked": true } },
      { $group: { _id: "$messages.products.productId", name: { $first: "$messages.products.name" }, slug: { $first: "$messages.products.slug" }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 }
    ]),
    ChatSession.aggregate([
      { $match: filter },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]),
    ChatUnansweredQuery.countDocuments({ ...filter, resolved: false }),
    ChatSession.aggregate([
      { $match: filter },
      { $unwind: "$messages" },
      { $unwind: "$messages.products" },
      { $group: { _id: "$messages.products.productId", name: { $first: "$messages.products.name" }, shown: { $sum: 1 }, clicks: { $sum: { $cond: ["$messages.products.clicked", 1, 0] } } } },
      { $sort: { shown: -1 } },
      { $limit: 20 }
    ])
  ]);

  return {
    totalSessions,
    totalMessages: totalMessages[0]?.total || 0,
    intentDistribution: intentDistribution.map((i) => ({ intent: i._id, count: i.count })),
    topClickedProducts: productClicks,
    dailyStats: dailyStats.map((d) => ({ date: d._id, sessions: d.count })),
    unansweredQueries: unanswered,
    bestSellersInChat: bestSellers.map((p) => ({
      productId: p._id,
      name: p.name,
      shown: p.shown,
      clicks: p.clicks,
      clickRate: p.shown > 0 ? ((p.clicks / p.shown) * 100).toFixed(1) : "0.0"
    }))
  };
};

export const exportConversations = async ({ startDate, endDate, format = "json" }) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const sessions = await ChatSession.find(filter)
    .populate("customer", "name email phone")
    .lean();

  const data = sessions.map((s) => ({
    sessionId: s.sessionId,
    customer: s.customer?.name || "Guest",
    customerEmail: s.customer?.email || "",
    status: s.status,
    totalMessages: s.messages?.length || 0,
    messages: s.messages?.map((m) => ({
      role: m.role,
      text: m.text,
      intent: m.intent,
      products: m.products?.map((p) => p.name).join(", "),
      timestamp: m.createdAt
    })),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }));

  if (format === "csv") return convertToCSV(data);
  return data;
};

const convertToCSV = (data) => {
  const headers = ["Session ID", "Customer", "Email", "Status", "Messages", "Created At", "Updated At"];
  const rows = data.map((s) => [
    s.sessionId,
    s.customer,
    s.customerEmail,
    s.status,
    s.totalMessages,
    s.createdAt,
    s.updatedAt
  ]);
  return [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
};
