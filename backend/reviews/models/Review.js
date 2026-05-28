import mongoose from "mongoose";

const reviewImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    path: { type: String, default: "" },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 200, default: "" },
    comment: { type: String, required: true, trim: true, maxlength: 5000 },
    images: [reviewImageSchema],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    adminResponse: { type: String, trim: true, maxlength: 2000, default: "" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isFeatured: 1, status: 1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ deletedAt: 1, status: 1, createdAt: -1 });

reviewSchema.pre(/^find/, function () {
  if (this._conditions?.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export default mongoose.model("Review", reviewSchema);
