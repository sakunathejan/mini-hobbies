import asyncHandler from "../../utils/asyncHandler.js";
import * as chatAnalytics from "../../services/chat/chatAnalyticsService.js";
import * as chatTracking from "../../services/chat/chatTrackingService.js";
import { getConversationDetail } from "../../services/chat/chatAnalyticsService.js";
import ChatSession from "../../models/chat/ChatSession.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const stats = await chatAnalytics.getDashboardStats();
  res.json(stats);
});

export const getConversations = asyncHandler(async (req, res) => {
  const { status, search, page, limit, sort } = req.query;
  const result = await chatAnalytics.getConversations({
    status,
    search,
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    sort
  });
  res.json(result);
});

export const getConversation = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await getConversationDetail(sessionId);
  if (!session) {
    res.status(404);
    throw new Error("Conversation not found.");
  }
  res.json(session);
});

export const resolveConversation = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    res.status(404);
    throw new Error("Conversation not found.");
  }
  await chatTracking.resolveSession(sessionId, req.user._id);
  res.json({ message: "Conversation marked as resolved." });
});

export const flagMessage = asyncHandler(async (req, res) => {
  const { sessionId, messageId } = req.params;
  const { reason } = req.body;

  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    res.status(404);
    throw new Error("Conversation not found.");
  }

  const msg = session.messages.id(messageId);
  if (!msg) {
    res.status(404);
    throw new Error("Message not found.");
  }

  msg.flagged = true;
  msg.flagReason = reason || "Flagged by admin";
  await session.save();

  res.json({ message: "Message flagged.", flagged: true });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await chatAnalytics.getAnalytics({ startDate, endDate });
  res.json(data);
});

export const exportConversations = asyncHandler(async (req, res) => {
  const { startDate, endDate, format } = req.query;
  const data = await chatAnalytics.exportConversations({ startDate, endDate, format });

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=chat-conversations.csv");
    return res.send(data);
  }
  res.json(data);
});
