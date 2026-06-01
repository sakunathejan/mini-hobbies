import mongoose from "mongoose";

const koombiyoWaybillSchema = new mongoose.Schema({
  waybillId: { type: String, required: true, unique: true },
  externalOrderId: { type: String, default: "" },
  receiverName: { type: String, default: "" },
  receiverPhone: { type: String, default: "" },
  receiverAddress: { type: String, default: "" },
  receiverDistrict: { type: String, default: "" },
  receiverCity: { type: String, default: "" },
  description: { type: String, default: "" },
  itemCount: { type: Number, default: 0 },
  orderValue: { type: Number, default: 0 },
  codAmount: { type: Number, default: 0 },
  status: { type: String, default: "" },
  currentLocation: { type: String, default: "" },
  lastUpdate: { type: String, default: "" },
  estimatedDelivery: { type: String, default: "" },
  rawResponse: mongoose.Schema.Types.Mixed,
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

koombiyoWaybillSchema.index({ status: 1 });
koombiyoWaybillSchema.index({ lastSyncedAt: 1 });

export default mongoose.model("KoombiyoWaybill", koombiyoWaybillSchema);
