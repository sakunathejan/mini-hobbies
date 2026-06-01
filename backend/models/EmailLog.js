import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  eventType: {
    type: String,
    enum: ["ORDER_CANCELLED", "ORDER_SHIPPED", "STATUS_UPDATED", "ORDER_DELIVERED"],
    required: true
  },
  status: { type: String, enum: ["sent", "failed", "retrying"], default: "sent" },
  error: { type: String, default: "" },
  sentAt: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

emailLogSchema.index({ order: 1, eventType: 1 });

export default mongoose.model("EmailLog", emailLogSchema);
