import mongoose from "mongoose";

const REACTION_TYPES = [
  "fire-build",
  "track-ready",
  "speed-king",
  "treasure-find",
  "wheel-spin",
  "collector-approved",
  "showcase-worthy",
  "must-have",
];

const reviewReactionSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    reactionType: { type: String, enum: REACTION_TYPES, required: true },
  },
  { timestamps: true }
);

reviewReactionSchema.index({ reviewId: 1, userId: 1 }, { unique: true });
reviewReactionSchema.index({ reviewId: 1, reactionType: 1 });
reviewReactionSchema.index({ userId: 1, createdAt: -1 });

export { REACTION_TYPES };
export default mongoose.model("ReviewReaction", reviewReactionSchema);
