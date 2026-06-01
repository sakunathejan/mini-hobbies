import mongoose from "mongoose";

const koombiyoPickupRequestSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: "KoombiyoShipment", index: true },
  waybillId: { type: String, default: "" },
  vehicleType: { type: String, enum: ["Bike", "Three wheel", "Lorry"], default: "Bike" },
  quantity: { type: Number, default: 1, min: 1 },
  pickupAddress: { type: String, required: true },
  phone: { type: String, required: true },
  remarks: { type: String, default: "" },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  rawResponse: mongoose.Schema.Types.Mixed,
  success: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
  requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

koombiyoPickupRequestSchema.index({ requestedAt: -1 });

export default mongoose.model("KoombiyoPickupRequest", koombiyoPickupRequestSchema);
