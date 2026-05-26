import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String, default: null },
    video: { type: String, default: null },
    type: { type: String, enum: ["banner", "popup", "toast"], default: "banner" },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    status: { type: String, enum: ["draft", "scheduled", "published", "archived"], default: "draft" },
    category: { type: String, default: "general", trim: true },
    ctaText: { type: String, default: null, trim: true },
    ctaUrl: { type: String, default: null, trim: true },
    audience: { type: String, enum: ["all", "users", "guests"], default: "all" },
    publishAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 }
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, publishAt: 1 });
announcementSchema.index({ isActive: 1, expiresAt: 1, type: 1 });
announcementSchema.index({ priority: -1, createdAt: -1 });
announcementSchema.index({ category: 1, status: 1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
