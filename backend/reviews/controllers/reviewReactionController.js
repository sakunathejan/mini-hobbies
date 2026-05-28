import asyncHandler from "../../utils/asyncHandler.js";
import * as reactionService from "../services/reviewReactionService.js";
import { validateReactionInput } from "../validators/reviewReactionValidator.js";

export const toggleReaction = asyncHandler(async (req, res) => {
  const errors = validateReactionInput(req.body);
  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(" ") });
    return;
  }

  const result = await reactionService.toggleReaction(
    req.body.reviewId,
    req.customer._id,
    req.body.reactionType
  );

  const summary = await reactionService.getReactionSummary(req.body.reviewId);
  res.json({ ...result, summary });
});

export const getReactionSummary = asyncHandler(async (req, res) => {
  const summary = await reactionService.getReactionSummary(req.params.reviewId);
  res.json({ summary });
});

export const getEngagementStats = asyncHandler(async (req, res) => {
  const stats = await reactionService.getEngagementStats();
  res.json(stats);
});

export const removeReactionAdmin = asyncHandler(async (req, res) => {
  const { reviewId, userId } = req.body;
  await reactionService.removeReactionAdmin(reviewId, userId);
  res.json({ message: "Reaction removed." });
});
