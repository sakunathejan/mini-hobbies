import mongoose from "mongoose";

const chatKnowledgeBaseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      enum: ["faq", "policy", "shipping", "product", "brand", "payment", "custom"],
      default: "faq"
    },
    tags: [String],
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0, min: 0, max: 100 },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

chatKnowledgeBaseSchema.index({ question: "text", answer: "text", tags: "text" });
chatKnowledgeBaseSchema.index({ category: 1, isActive: 1, priority: -1 });
chatKnowledgeBaseSchema.index({ isActive: 1, usageCount: -1 });

export default mongoose.model("ChatKnowledgeBase", chatKnowledgeBaseSchema);
