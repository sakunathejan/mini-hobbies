import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: ["advance_50", "full_payment", "cod", "custom"], default: "custom" },
    enabled: { type: Boolean, default: true },
    requiresSlipUpload: { type: Boolean, default: false },
    supportsPartialPayment: { type: Boolean, default: false },
    isOnlineGateway: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

paymentMethodSchema.index({ enabled: 1, sortOrder: 1 });

export default mongoose.model("PaymentMethod", paymentMethodSchema);
