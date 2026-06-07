import mongoose from "mongoose";
import slugify from "slugify";

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    path: { type: String, default: "" },
    alt: { type: String, default: "" }
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    price: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: {
      url: { type: String, default: "" },
      path: { type: String, default: "" },
      alt: { type: String, default: "" }
    }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    brand: { type: String, default: "Mini Hobbies" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    stockStatus: { type: String, enum: ["in_stock", "low_stock", "out_of_stock"], default: "in_stock" },
    lowStockThreshold: { type: Number, default: 3 },
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    images: [productImageSchema],
    tags: [{ type: String, trim: true }],
    scale: { type: String, default: "" },
    material: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    condition: {
      type: String,
      enum: ["New", "Pre-owned", "Limited Edition"],
      default: "New"
    },
    weightKg: { type: Number, default: 0.5, min: 0 },
    productType: {
      type: String,
      enum: ["IN_STOCK", "PRE_ORDER", "OUT_OF_STOCK"],
      default: "IN_STOCK"
    },
    isPreOrder: { type: Boolean, default: false },
    preOrderDeadline: { type: Date },
    preOrderExpectedDate: { type: Date },
    preOrderNotes: { type: String, default: "" },
    preOrderDepositRequired: { type: Boolean, default: false },
    preOrderDepositAmount: { type: Number, default: 0, min: 0 },
    preOrderPaymentMode: {
      type: String,
      enum: ["FULL_PAYMENT", "DEPOSIT_PAYMENT", "NO_PAYMENT"],
      default: "FULL_PAYMENT"
    },
    preOrderLimit: { type: Number, default: 0, min: 0 },
    preOrderSoldCount: { type: Number, default: 0, min: 0 },
    preOrderStatus: {
      type: String,
      enum: ["PRE_ORDER_ACTIVE", "PRE_ORDER_CLOSED", "PRE_ORDER_DELAYED", "PRE_ORDER_ARRIVED", "PRE_ORDER_CANCELLED", "IN_STOCK"],
      default: "PRE_ORDER_ACTIVE"
    },
    preOrderClosedAt: { type: Date },
    preOrderArrivedAt: { type: Date },
    preOrderCancelledAt: { type: Date },
    preOrderDelayedAt: { type: Date },
    preOrderDelayNote: { type: String, default: "" },
    preOrderDelayExpectedDate: { type: Date },
    preOrderLog: [{
      from: { type: String },
      to: { type: String, required: true },
      trigger: { type: String, enum: ["cron", "admin", "system"], default: "admin" },
      note: { type: String, default: "" },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text", tags: "text" });
productSchema.index({ category: 1, featured: -1, createdAt: -1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ featured: -1, createdAt: -1 });
productSchema.index({ stockStatus: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ preOrderStatus: 1, preOrderDeadline: 1 });

productSchema.pre("save", function makeSlug(next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.hasVariants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  if (this.productType === "PRE_ORDER") {
    this.isPreOrder = true;
    if (!this.preOrderStatus) this.preOrderStatus = "PRE_ORDER_ACTIVE";
    if (this.preOrderStatus !== "PRE_ORDER_ARRIVED" && this.preOrderStatus !== "IN_STOCK") {
      this.stock = 0;
      if (this.hasVariants && this.variants.length > 0) {
        this.variants.forEach(v => { v.stock = 0; });
      }
    }
    if (!this.preOrderPaymentMode) this.preOrderPaymentMode = "FULL_PAYMENT";
  } else {
    this.isPreOrder = false;
  }

  if (this.preOrderStatus === "IN_STOCK") {
    this.productType = "IN_STOCK";
    this.isPreOrder = false;
  }

  if (this.productType === "OUT_OF_STOCK") {
    this.stockStatus = "out_of_stock";
    this.stock = 0;
  } else if (this.preOrderStatus === "PRE_ORDER_ARRIVED" || this.preOrderStatus === "IN_STOCK") {
    this.stockStatus = this.stock > 0 ? "in_stock" : "out_of_stock";
  } else if (this.isPreOrder) {
    this.stockStatus = "in_stock";
  } else if (this.stock <= 0) {
    this.stockStatus = "out_of_stock";
  } else if (this.stock <= (this.lowStockThreshold || 3)) {
    this.stockStatus = "low_stock";
  } else {
    this.stockStatus = "in_stock";
  }

  if (this.isModified("preOrderLog") && this.preOrderLog.length > 50) {
    this.preOrderLog = this.preOrderLog.slice(-50);
  }
  next();
});

export default mongoose.model("Product", productSchema);
