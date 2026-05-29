import ChatSession from "../../models/chat/ChatSession.js";
import ChatUnansweredQuery from "../../models/chat/ChatUnansweredQuery.js";
import { normalizeOrder } from "../../utils/normalizeOrder.js";
import Order from "../../models/Order.js";

const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

export const trackMessage = async ({ sessionId, customerId, role, text, intent, products, responseTimeMs }) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          customer: customerId || null,
          status: "active",
          metadata: { totalMessages: 0, clickedProducts: 0 }
        },
        $push: {
          messages: {
            role,
            text,
            intent,
            products: products || [],
            responseTimeMs
          }
        },
        $inc: { "metadata.totalMessages": 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (role === "user" && intent === "unknown" && text.length > 3) {
      await trackUnanswered(text, sessionId, { intent });
    }

    if (session.metadata.totalMessages > 50) {
      await ChatSession.updateOne(
        { sessionId, status: "active" },
        { status: "abandoned" }
      );
    }
  } catch (err) {
    console.error("[ChatTracking] Failed to track message:", err.message);
  }
};

export const trackProductClick = async (sessionId, product) => {
  try {
    const session = await ChatSession.findOne({ sessionId });
    if (!session) return;

    const lastMsg = session.messages[session.messages.length - 1];
    if (lastMsg && lastMsg.role === "bot" && lastMsg.products?.length > 0) {
      const existing = lastMsg.products.find(
        (p) => p.productId?.toString() === product._id
      );
      if (existing && !existing.clicked) {
        await ChatSession.updateOne(
          { "messages._id": lastMsg._id, "messages.products.productId": product._id },
          { $set: { "messages.$.products.$[p].clicked": true, "messages.$.products.$[p].clickedAt": new Date() } },
          { arrayFilters: [{ "p.productId": product._id }] }
        );
      }
    }
    await ChatSession.updateOne(
      { sessionId },
      { $inc: { "metadata.clickedProducts": 1 } }
    );
  } catch (err) {
    console.error("[ChatTracking] Failed to track product click:", err.message);
  }
};

export const resolveSession = async (sessionId, adminId) => {
  try {
    await ChatSession.updateOne(
      { sessionId },
      { status: "resolved", resolvedAt: new Date(), resolvedBy: adminId }
    );
  } catch (err) {
    console.error("[ChatTracking] Failed to resolve session:", err.message);
  }
};

const trackUnanswered = async (question, sessionId, context) => {
  try {
    const normalized = normalizeText(question);
    const existing = await ChatUnansweredQuery.findOne({ normalizedQuestion: normalized, resolved: false });
    if (existing) {
      await ChatUnansweredQuery.updateOne(
        { _id: existing._id },
        { $inc: { count: 1 }, $set: { lastAskedAt: new Date() } }
      );
    } else {
      await ChatUnansweredQuery.create({
        question,
        sessionId,
        normalizedQuestion: normalized,
        context: context || {}
      });
    }
  } catch (err) {
    console.error("[ChatTracking] Failed to track unanswered:", err.message);
  }
};

export const getChatToOrderConversion = async (startDate, endDate) => {
  try {
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const sessionsWithOrders = await ChatSession.countDocuments({
      "metadata.orderReference": { $ne: null, $exists: true },
      ...filter
    });
    const totalSessions = await ChatSession.countDocuments({
      status: { $ne: "active" },
      ...filter
    });
    const revenue = await Order.aggregate([
      { $match: { notes: { $regex: /chatbot|mini.?bot|chat/i } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    return {
      totalSessions,
      sessionsWithOrders,
      conversionRate: totalSessions > 0 ? ((sessionsWithOrders / totalSessions) * 100).toFixed(1) : 0,
      revenueInfluenced: revenue[0]?.total || 0
    };
  } catch (err) {
    console.error("[ChatTracking] Conversion error:", err.message);
    return { totalSessions: 0, sessionsWithOrders: 0, conversionRate: 0, revenueInfluenced: 0 };
  }
};
