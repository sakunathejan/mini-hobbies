import mongoose from "mongoose";

const koombiyoReturnSchema = new mongoose.Schema({
  noteId: { type: String, required: true, unique: true, index: true },
  waybillId: { type: String, default: "", index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
  itemName: { type: String, default: "" },
  date: { type: String, default: "" },
  status: { type: String, default: "" },
  rawResponse: mongoose.Schema.Types.Mixed,
  receivedAt: { type: Date },
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

koombiyoReturnSchema.index({ status: 1 });

export default mongoose.model("KoombiyoReturn", koombiyoReturnSchema);
