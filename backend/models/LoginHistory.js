import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  ip: { type: String },
  device: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  failureReason: { type: String },
}, { timestamps: true });

loginHistorySchema.index({ customer: 1, createdAt: -1 });
loginHistorySchema.index({ createdAt: -1 });

export default mongoose.model("LoginHistory", loginHistorySchema);
