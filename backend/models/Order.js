import mongoose from "mongoose";
import { ORDER_STATUS, VALID_STATUSES } from "../constants/orderStatus.js";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variantId: { type: String, default: "" },
    variantName: { type: String, default: "" },
    variantImage: { type: String, default: "" }
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
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, default: "" },
      city: { type: String, default: "" }
    },
    districtId: { type: Number },
    cityId: { type: Number },
    koombiyoWaybillId: { type: String, default: "" },
    isKoombiyoActive: { type: Boolean, default: false },
    productValue: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    codTotal: { type: Number, default: 0 },
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
    paymentType: { type: String, enum: ["advance_50", "full_payment", "cod"], default: "full_payment" },
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
        "Fully Paid Pending Verification",
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
    lifecycleStatus: {
      type: String,
      enum: VALID_STATUSES,
      default: ORDER_STATUS.PENDING
    },
    cancellationReason: { type: String, default: "" },
    cancelledAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    lastSyncAt: { type: Date },
    emailLogs: [{
      eventType: { type: String },
      to: { type: String },
      subject: { type: String },
      sentAt: { type: Date, default: Date.now },
      status: { type: String, enum: ["sent", "failed"], default: "sent" }
    }],
    statusHistory: [statusHistorySchema],
    notes: { type: String, default: "" },
    delivery: {
      provider: { type: String, default: "koombiyo" },
      shipmentCreated: { type: Boolean, default: false },
      shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "KoombiyoShipment" },
      waybillId: { type: String, default: "" },
      trackingUrl: { type: String, default: "" },
      deliveryStatus: { type: String, default: "pending" },
      shipmentCreatedAt: { type: Date },
      lastTrackingSyncAt: { type: Date },
      lastPickupRequest: { type: Date },
      pickupResponse: mongoose.Schema.Types.Mixed,
      returnReceivedAt: { type: Date },
      history: [{
        status: String,
        label: String,
        location: String,
        timestamp: Date,
        source: String,
        raw: mongoose.Schema.Types.Mixed
      }],
      rawResponse: mongoose.Schema.Types.Mixed
    },
    whatsappMessageId: { type: String, default: "" },
    whatsappStatus: { type: String, enum: ["", "sent", "failed", "retrying"], default: "" },
    whatsappSentAt: { type: Date },
    whatsappErrorLog: [{ message: String, timestamp: { type: Date, default: Date.now } }]
  },
  { timestamps: true, strict: false }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ lifecycleStatus: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1, orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customer.email": 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
