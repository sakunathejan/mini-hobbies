import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    sessionId: { type: String },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true }
);

wishlistSchema.index({ customerId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Wishlist", wishlistSchema);
