import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
  orderNumber: { type: String, default: "" },
  user: { type: String, default: "system" },
  resource: { type: String, default: "" },
  resourceId: { type: String, default: "" },
  details: mongoose.Schema.Types.Mixed,
  ip: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
