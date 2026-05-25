import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, min: 1, default: 1 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
