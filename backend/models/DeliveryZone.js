import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema(
  {
    district: { type: String, required: true, unique: true, trim: true },
    fee: { type: Number, required: true, default: 650, min: 0 },
    codAvailable: { type: Boolean, default: true },
    estimatedDays: { type: String, default: "3-5 business days" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryZone", deliveryZoneSchema);
