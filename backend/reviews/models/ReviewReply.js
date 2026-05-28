import mongoose from "mongoose";

const reviewReplySchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: "ReviewReply", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    edited: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewReplySchema.index({ reviewId: 1, deletedAt: 1, createdAt: 1 });
reviewReplySchema.index({ parentReplyId: 1 });
reviewReplySchema.index({ userId: 1, createdAt: -1 });

reviewReplySchema.pre(/^find/, function () {
  if (this._conditions?.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export default mongoose.model("ReviewReply", reviewReplySchema);
