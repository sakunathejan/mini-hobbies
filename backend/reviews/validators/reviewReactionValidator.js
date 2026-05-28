import { REACTION_TYPES } from "../models/ReviewReaction.js";

export function validateReactionInput(body) {
  const errors = [];
  const { reactionType, reviewId } = body;

  if (!reviewId) {
    errors.push("Review ID is required.");
  }

  if (!reactionType) {
    errors.push("Reaction type is required.");
  } else if (!REACTION_TYPES.includes(reactionType)) {
    errors.push(`Invalid reaction type. Must be one of: ${REACTION_TYPES.join(", ")}`);
  }

  return errors;
}
