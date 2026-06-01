import mongoose from "mongoose";

const koombiyoCitySchema = new mongoose.Schema({
  cityId: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, default: "", index: true },
  districtId: { type: Number, required: true, index: true },
  districtName: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  lastSyncedAt: { type: Date }
}, { timestamps: true });

koombiyoCitySchema.index({ cityId: 1, districtId: 1 }, { unique: true });
koombiyoCitySchema.index({ districtId: 1, isActive: 1 });

export default mongoose.model("KoombiyoCity", koombiyoCitySchema);
