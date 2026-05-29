import mongoose from "mongoose";

const moderationCaseSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  moderatorName: { type: String, required: true },
  type: {
    type: String,
    enum: ["warning", "suspension", "ban"],
    required: true,
    index: true
  },
  reason: { type: String, required: true },
  message: { type: String, default: "" },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium"
  },
  status: {
    type: String,
    enum: ["active", "expired", "lifted"],
    default: "active",
    index: true
  },
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date, default: null },
  appealStatus: {
    type: String,
    enum: ["none", "pending", "under_review", "waiting_customer", "approved", "rejected", "escalated"],
    default: "none"
  },
  appealMessage: { type: String, default: "" },
  appealReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  appealReviewedAt: { type: Date, default: null },
  appealReviewNotes: { type: String, default: "" },
  appealInternalNotes: [{ text: String, author: String, createdAt: { type: Date, default: Date.now } }],
  notes: { type: String, default: "" },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

moderationCaseSchema.index({ customer: 1, status: 1 });
moderationCaseSchema.index({ status: 1, endAt: 1 });
moderationCaseSchema.index({ appealStatus: 1 });
moderationCaseSchema.index({ status: 1, appealStatus: 1 });
moderationCaseSchema.index({ moderator: 1, createdAt: -1 });

export default mongoose.model("ModerationCase", moderationCaseSchema);
