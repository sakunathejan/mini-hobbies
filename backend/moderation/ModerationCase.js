import mongoose from "mongoose";

const moderationCaseSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["warning", "suspension", "ban"],
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "expired", "appealed", "lifted"],
    default: "active",
  },
  duration: {
    type: Number,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  issuedByName: {
    type: String,
    default: "",
  },
  appealed: {
    type: Boolean,
    default: false,
  },
  appealMessage: {
    type: String,
    default: "",
    trim: true,
  },
  appealResponse: {
    type: String,
    default: "",
    trim: true,
  },
  appealDate: {
    type: Date,
    default: null,
  },
  appealResolvedAt: {
    type: Date,
    default: null,
  },
  appealResolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  evidence: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

moderationCaseSchema.index({ customerId: 1, status: 1 });
moderationCaseSchema.index({ status: 1, expiresAt: 1 });
moderationCaseSchema.index({ type: 1, status: 1 });
moderationCaseSchema.index({ createdAt: -1 });

export default mongoose.model("ModerationCase", moderationCaseSchema);
