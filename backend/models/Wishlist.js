import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", wishlistSchema);
