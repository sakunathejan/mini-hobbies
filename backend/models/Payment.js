import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    method: { type: String, enum: ["bank_transfer", "cod", "advance"], required: true },
    status: {
      type: String,
      enum: ["pending", "awaiting_verification", "verified", "failed", "rejected", "refunded"],
      default: "pending"
    },
    bankTransfer: {
      bankName: { type: String },
      accountName: { type: String },
      accountNumber: { type: String },
      branch: { type: String },
      slipUrl: { type: String },
      slipPath: { type: String }
    },
    advance: {
      percentage: { type: Number, default: 50 },
      amount: { type: Number },
      paidAt: { type: Date },
      remainingAmount: { type: Number }
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
