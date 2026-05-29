import asyncHandler from "../../utils/asyncHandler.js";
import * as chatConfigService from "../../services/chat/chatConfigService.js";
import { processMessage } from "../../services/chatService.js";
import { findAnswer } from "../../services/chat/chatKnowledgeService.js";

export const getConfig = asyncHandler(async (_req, res) => {
  const config = await chatConfigService.getConfig();
  res.json(config);
});

export const updateConfig = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    res.status(400);
    throw new Error("Key and value are required.");
  }
  const result = await chatConfigService.updateConfig(key, value, req.user._id);
  res.json(result);
});

export const updateConfigBulk = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!updates || typeof updates !== "object") {
    res.status(400);
    throw new Error("Updates object is required.");
  }
  const result = await chatConfigService.updateConfigBulk(updates, req.user._id);
  res.json(result);
});

export const resetConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const result = await chatConfigService.resetConfig(key, req.user._id);
  res.json(result);
});

export const testResponse = asyncHandler(async (req, res) => {
  const { message, includeKnowledge } = req.body;
  if (!message) {
    res.status(400);
    throw new Error("Message is required.");
  }

  const config = await chatConfigService.getConfig();

  let knowledgeMatch = null;
  if (includeKnowledge !== false) {
    knowledgeMatch = await findAnswer(message);
  }

  const botResponse = await processMessage(message, {});

  res.json({
    input: message,
    knowledgeMatch: knowledgeMatch
      ? {
          matched: true,
          answer: knowledgeMatch.answer,
          category: knowledgeMatch.category,
          question: knowledgeMatch.question
        }
      : { matched: false },
    botResponse,
    appliedConfig: {
      tone: config.behavior?.tone || "casual",
      useEmoji: config.behavior?.useEmoji ?? true,
      features: config.features || {}
    }
  });
});

export const getUnansweredQueries = asyncHandler(async (req, res) => {
  const ChatUnansweredQueryModel = (await import("../../models/chat/ChatUnansweredQuery.js")).default;
  const { resolved, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (resolved !== undefined) filter.resolved = resolved === "true";
  if (search) filter.question = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    ChatUnansweredQueryModel.find(filter)
      .select("question sessionId count firstAskedAt lastAskedAt resolved resolution")
      .sort({ count: -1, lastAskedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean(),
    ChatUnansweredQueryModel.countDocuments(filter)
  ]);

  res.json({ queries: items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

export const resolveUnanswered = asyncHandler(async (req, res) => {
  const ChatUnansweredQueryModel = (await import("../../models/chat/ChatUnansweredQuery.js")).default;
  const { id } = req.params;
  const { type, answer, linkedProductId, linkedProductName } = req.body;

  const query = await ChatUnansweredQueryModel.findById(id);
  if (!query) {
    res.status(404);
    throw new Error("Query not found.");
  }

  query.resolved = true;
  query.resolution = { type, answer, linkedProductId, linkedProductName };
  query.resolvedAt = new Date();
  query.resolvedBy = req.user._id;
  await query.save();

  if (type === "knowledge" && answer) {
    const knowledgeService = await import("../../services/chat/chatKnowledgeService.js");
    await knowledgeService.createKnowledge(
      { question: query.question, answer, category: "faq", tags: ["from_unanswered"] },
      req.user._id
    );
  }

  res.json({ message: "Query resolved.", query });
});
