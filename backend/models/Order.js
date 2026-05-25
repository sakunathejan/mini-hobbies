import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variantId: { type: String, default: "" },
    variantName: { type: String, default: "" }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const partialPaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, enum: ["bank_transfer"], default: "bank_transfer" },
    slipUrl: { type: String, default: "" },
    slipPath: { type: String, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    type: { type: String, enum: ["advance", "balance"], required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, default: "" }
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    advanceAmount: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    partialPayments: [partialPaymentSchema],
    fullyPaidAt: { type: Date },
    paymentMethod: { type: String, enum: ["bank_transfer", "cod", "advance"], default: "bank_transfer" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    coupon: {
      code: { type: String },
      discount: { type: Number, default: 0 }
    },
    trackingNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "Pending Advance Payment",
        "Pending Payment Verification",
        "Advance Payment Submitted",
        "Payment Confirmed",
        "Advance Payment Confirmed",
        "Awaiting Final Payment",
        "Fully Paid",
        "Preparing Order",
        "Shipped",
        "Delivered",
        "Cancelled"
      ],
      default: "Pending Advance Payment"
    },
    statusHistory: [statusHistorySchema],
    notes: { type: String, default: "" },
    whatsappMessageId: { type: String, default: "" },
    whatsappStatus: { type: String, enum: ["", "sent", "failed", "retrying"], default: "" },
    whatsappSentAt: { type: Date },
    whatsappErrorLog: [{ message: String, timestamp: { type: Date, default: Date.now } }]
  },
  { timestamps: true, strict: false }
);

export default mongoose.model("Order", orderSchema);
