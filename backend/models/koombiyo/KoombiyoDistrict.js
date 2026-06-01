import mongoose from "mongoose";

const koombiyoDistrictSchema = new mongoose.Schema({
  districtId: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, default: "", index: true },
  isActive: { type: Boolean, default: true },
  lastSyncedAt: { type: Date }
}, { timestamps: true });

koombiyoDistrictSchema.index({ isActive: 1 });

export default mongoose.model("KoombiyoDistrict", koombiyoDistrictSchema);
