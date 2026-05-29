import ChatKnowledgeBase from "../../models/chat/ChatKnowledgeBase.js";
import * as cache from "../../utils/cache.js";

const KNOWLEDGE_CACHE_TTL = 5 * 60 * 1000;
const KNOWLEDGE_CACHE_KEY = "chat:knowledge:active";

const preloadKnowledge = async () => {
  try {
    const items = await ChatKnowledgeBase.find({ isActive: true })
      .select("question answer category tags priority usageCount")
      .sort({ priority: -1, usageCount: -1 })
      .lean();
    cache.set(KNOWLEDGE_CACHE_KEY, items, KNOWLEDGE_CACHE_TTL);
    return items;
  } catch (err) {
    console.error("[ChatKnowledge] Preload failed:", err.message);
    return [];
  }
};

export const getActiveKnowledge = async (forceRefresh = false) => {
  if (forceRefresh) return preloadKnowledge();
  let items = cache.get(KNOWLEDGE_CACHE_KEY);
  if (!items) items = await preloadKnowledge();
  return items;
};

export const findAnswer = async (question) => {
  const items = await getActiveKnowledge();
  const normalized = question.toLowerCase().trim();
  const keywords = normalized.split(/\s+/).filter((w) => w.length > 2);

  let best = null;
  let bestScore = 0;

  for (const item of items) {
    const qLower = item.question.toLowerCase();

    let score = 0;
    for (const kw of keywords) {
      if (qLower.includes(kw)) score += 1;
      if (item.tags?.some((t) => t.toLowerCase().includes(kw))) score += 1.5;
    }

    const exactMatch = item.question.toLowerCase().trim() === normalized;
    if (exactMatch) score += 10;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore >= 2) {
    await ChatKnowledgeBase.updateOne({ _id: best._id }, { $inc: { usageCount: 1 } });
    cache.del(KNOWLEDGE_CACHE_KEY);
    return best;
  }

  return null;
};

export const createKnowledge = async (data, adminId) => {
  const existing = await ChatKnowledgeBase.findOne({
    question: { $regex: `^${data.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
  });
  if (existing) throw new Error("A knowledge entry with this question already exists.");

  const item = await ChatKnowledgeBase.create({ ...data, createdBy: adminId });
  await preloadKnowledge();
  return item;
};

export const updateKnowledge = async (id, data) => {
  const item = await ChatKnowledgeBase.findByIdAndUpdate(id, data, { new: true });
  if (item) await preloadKnowledge();
  return item;
};

export const deleteKnowledge = async (id) => {
  await ChatKnowledgeBase.findByIdAndDelete(id);
  await preloadKnowledge();
};

export const bulkImportKnowledge = async (entries, adminId) => {
  const results = { success: 0, failed: 0, errors: [] };
  for (const entry of entries) {
    if (!entry.question || !entry.answer) {
      results.failed++;
      results.errors.push({ question: entry.question || "(empty)", error: "Missing question or answer" });
      continue;
    }
    try {
      const existing = await ChatKnowledgeBase.findOne({
        question: { $regex: `^${entry.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
      });
      if (existing) {
        await ChatKnowledgeBase.updateOne({ _id: existing._id }, {
          answer: entry.answer,
          category: entry.category || "faq",
          tags: entry.tags || [],
          priority: entry.priority ?? 0
        });
      } else {
        await ChatKnowledgeBase.create({
          question: entry.question,
          answer: entry.answer,
          category: entry.category || "faq",
          tags: entry.tags || [],
          priority: entry.priority ?? 0,
          createdBy: adminId
        });
      }
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ question: entry.question, error: err.message });
    }
  }
  await preloadKnowledge();
  return results;
};
