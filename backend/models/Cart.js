import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, min: 1, default: 1 },
    variantId: { type: String, default: "" },
    variantName: { type: String, default: "" },
    variantImage: { type: String, default: "" }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    sessionId: { type: String },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

cartSchema.index({ customerId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Cart", cartSchema);
