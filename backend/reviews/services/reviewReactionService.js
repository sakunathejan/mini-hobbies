import ReviewReaction from "../models/ReviewReaction.js";
import Review from "../models/Review.js";
import Customer from "../../models/Customer.js";

const recentReactions = new Map();

export async function toggleReaction(reviewId, userId, reactionType) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }

  const now = Date.now();
  const key = `${userId}-${reviewId}`;
  const lastReact = recentReactions.get(key);
  if (lastReact && now - lastReact < 2000) {
    throw Object.assign(new Error("Please wait before reacting again."), { statusCode: 429 });
  }

  const existing = await ReviewReaction.findOne({ reviewId, userId }).sort({ createdAt: -1 });

  if (existing) {
    if (existing.reactionType === reactionType) {
      await ReviewReaction.deleteMany({ reviewId, userId });
      recentReactions.set(key, now);
      setTimeout(() => recentReactions.delete(key), 2000);
      return { added: false, reactionType, previousReaction: null };
    }
    const prevType = existing.reactionType;
    await ReviewReaction.deleteMany({ reviewId, userId });
    await ReviewReaction.create({ reviewId, userId, reactionType });
    recentReactions.set(key, now);
    setTimeout(() => recentReactions.delete(key), 2000);
    return { added: true, reactionType, previousReaction: prevType, replaced: true };
  }

  await ReviewReaction.create({ reviewId, userId, reactionType });
  recentReactions.set(key, now);
  setTimeout(() => recentReactions.delete(key), 2000);
  return { added: true, reactionType, previousReaction: null, replaced: false };
}

export async function getReactionSummary(reviewId) {
  const results = await ReviewReaction.aggregate([
    { $match: { reviewId: reviewId } },
    { $group: { _id: "$reactionType", count: { $sum: 1 } } },
  ]);

  const summary = {};
  for (const r of results) {
    summary[r._id] = r.count;
  }
  return summary;
}

export async function getUserReactions(reviewIds, userId) {
  if (!reviewIds.length || !userId) return {};
  const reactions = await ReviewReaction.find({
    reviewId: { $in: reviewIds },
    userId,
  }).lean();

  const map = {};
  for (const r of reactions) {
    map[r.reviewId] = r.reactionType;
  }
  return map;
}

export async function bulkReactionSummary(reviewIds) {
  if (!reviewIds.length) return {};
  const results = await ReviewReaction.aggregate([
    { $match: { reviewId: { $in: reviewIds } } },
    { $group: { _id: { reviewId: "$reviewId", reactionType: "$reactionType" }, count: { $sum: 1 } } },
  ]);

  const map = {};
  for (const r of results) {
    const rid = r._id.reviewId.toString();
    if (!map[rid]) map[rid] = {};
    map[rid][r._id.reactionType] = r.count;
  }
  return map;
}

export async function removeReactionAdmin(reviewId, userId) {
  const reaction = await ReviewReaction.findOne({ reviewId, userId });
  if (!reaction) {
    throw Object.assign(new Error("Reaction not found."), { statusCode: 404 });
  }
  await reaction.deleteOne();
  return { removed: true };
}

export async function getEngagementStats() {
  const totalReactions = await ReviewReaction.countDocuments();
  const topReactions = await ReviewReaction.aggregate([
    { $group: { _id: "$reactionType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const mostReactedReviews = await ReviewReaction.aggregate([
    { $group: { _id: "$reviewId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    totalReactions,
    topReactions,
    mostReactedReviews,
  };
}
