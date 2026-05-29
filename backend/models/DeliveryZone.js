import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    normalizedFrom: { type: String, default: "", index: true },
    normalizedTo: { type: String, default: "", index: true },
    firstKgCharge: { type: Number, required: true, default: 350, min: 0 },
    additionalKgCharge: { type: Number, required: true, default: 80, min: 0 },
    courierProvider: { type: String, default: "koombiyo", index: true },
    importedAt: { type: Date },
    sourceFile: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

deliveryZoneSchema.index({ normalizedFrom: 1, normalizedTo: 1 }, { unique: true });
deliveryZoneSchema.index({ courierProvider: 1, isActive: 1 });

export default mongoose.model("DeliveryZone", deliveryZoneSchema);
