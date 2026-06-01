import mongoose from "mongoose";

const koombiyoShipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  orderNumber: { type: String, default: "" },
  waybillId: { type: String, default: "" },
  trackingUrl: { type: String, default: "" },
  deliveryStatus: { type: String, default: "pending", index: true },
  shipmentCreatedAt: { type: Date },
  lastTrackingSyncAt: { type: Date },
  lastPickupRequestAt: { type: Date },
  pickupResponse: mongoose.Schema.Types.Mixed,
  returnReceivedAt: { type: Date },
  returnNoteId: { type: String, default: "" },
  receiverDistrict: { type: Number, default: 5 },
  receiverCity: { type: Number, default: 5 },
  rawCreateResponse: mongoose.Schema.Types.Mixed,
  history: [{
    status: { type: String, default: "" },
    label: { type: String, default: "" },
    location: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    source: { type: String, enum: ["api", "webhook", "manual"], default: "api" },
    raw: mongoose.Schema.Types.Mixed
  }],
  cancelledAt: { type: Date },
  cancelReason: { type: String, default: "" }
}, { timestamps: true });

koombiyoShipmentSchema.index({ deliveryStatus: 1, createdAt: -1 });
koombiyoShipmentSchema.index({ waybillId: 1 });

export default mongoose.model("KoombiyoShipment", koombiyoShipmentSchema);
