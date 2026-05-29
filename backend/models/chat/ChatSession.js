import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "bot"], required: true },
    text: { type: String, required: true },
    intent: { type: String },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        slug: String,
        price: Number,
        image: String,
        clicked: { type: Boolean, default: false },
        clickedAt: Date
      }
    ],
    flagged: { type: Boolean, default: false },
    flagReason: String,
    responseTimeMs: Number
  },
  { timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["active", "resolved", "abandoned"], default: "active" },
    messages: [chatMessageSchema],
    metadata: {
      totalMessages: { type: Number, default: 0 },
      clickedProducts: { type: Number, default: 0 },
      orderReference: String,
      tags: [String],
      userAgent: String
    },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

chatSessionSchema.index({ "messages.createdAt": -1 });
chatSessionSchema.index({ status: 1, updatedAt: -1 });
chatSessionSchema.index({ customer: 1, createdAt: -1 });
chatSessionSchema.index({ "messages.intent": 1 });
chatSessionSchema.index({ "messages.products.productId": 1 });

export default mongoose.model("ChatSession", chatSessionSchema);
