import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      "SHIPMENT_CREATED",
      "SHIPMENT_UPDATED",
      "SHIPMENT_CANCELLED",
      "STATUS_CHANGED",
      "EMAIL_SENT",
      "SYNC_FAILED",
      "WAYBILL_ALLOCATED",
      "ORDER_CANCELLED",
      "PAYMENT_UPDATED",
      "LOCATION_VALIDATION_FAILED"
    ],
    required: true,
    index: true
  },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
  orderNumber: { type: String, default: "" },
  user: { type: String, default: "system" },
  details: mongoose.Schema.Types.Mixed,
  ip: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
