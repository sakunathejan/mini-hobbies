import asyncHandler from "../../utils/asyncHandler.js";
import ChatKnowledgeBase from "../../models/chat/ChatKnowledgeBase.js";
import * as chatKnowledge from "../../services/chat/chatKnowledgeService.js";

export const listKnowledge = asyncHandler(async (req, res) => {
  const { category, search, isActive, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) {
    filter.$or = [
      { question: { $regex: search, $options: "i" } },
      { answer: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    ChatKnowledgeBase.find(filter)
      .select("question answer category tags isActive priority usageCount createdAt updatedAt")
      .sort({ priority: -1, usageCount: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean(),
    ChatKnowledgeBase.countDocuments(filter)
  ]);

  res.json({ knowledge: items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

export const getKnowledge = asyncHandler(async (req, res) => {
  const item = await ChatKnowledgeBase.findById(req.params.id).lean();
  if (!item) {
    res.status(404);
    throw new Error("Knowledge entry not found.");
  }
  res.json(item);
});

export const createKnowledge = asyncHandler(async (req, res) => {
  const item = await chatKnowledge.createKnowledge(req.body, req.user._id);
  res.status(201).json(item);
});

export const updateKnowledge = asyncHandler(async (req, res) => {
  const item = await chatKnowledge.updateKnowledge(req.params.id, req.body);
  if (!item) {
    res.status(404);
    throw new Error("Knowledge entry not found.");
  }
  res.json(item);
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  const item = await ChatKnowledgeBase.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Knowledge entry not found.");
  }
  await chatKnowledge.deleteKnowledge(req.params.id);
  res.json({ message: "Knowledge entry deleted." });
});

export const bulkImportKnowledge = asyncHandler(async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400);
    throw new Error("Entries array is required.");
  }
  const result = await chatKnowledge.bulkImportKnowledge(entries, req.user._id);
  res.json(result);
});

export const testKnowledgeMatch = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question) {
    res.status(400);
    throw new Error("Question is required.");
  }
  const match = await chatKnowledge.findAnswer(question);
  res.json({
    question,
    matched: !!match,
    matchQuality: match ? "high" : "none",
    answer: match?.answer || null,
    category: match?.category || null,
    confidence: match ? Math.min((match.priority || 0) + 5, 10) : 0
  });
});
