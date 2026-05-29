import mongoose from "mongoose";

const chatUnansweredQuerySchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    sessionId: { type: String, required: true },
    normalizedQuestion: { type: String, index: true },
    context: {
      intent: String,
      lastProducts: [String],
      page: String
    },
    count: { type: Number, default: 1 },
    firstAskedAt: { type: Date, default: Date.now },
    lastAskedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolution: {
      type: { type: String, enum: ["knowledge", "product", "override"] },
      answer: String,
      linkedProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      linkedProductName: String
    },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

chatUnansweredQuerySchema.index({ normalizedQuestion: 1, resolved: 1 });
chatUnansweredQuerySchema.index({ count: -1 });
chatUnansweredQuerySchema.index({ resolved: 1, lastAskedAt: -1 });

export default mongoose.model("ChatUnansweredQuery", chatUnansweredQuerySchema);
