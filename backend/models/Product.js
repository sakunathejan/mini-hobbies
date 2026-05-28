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
    }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text", tags: "text" });
productSchema.index({ category: 1, featured: -1, createdAt: -1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ featured: -1, createdAt: -1 });
productSchema.index({ stockStatus: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre("save", function makeSlug(next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.hasVariants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  if (this.stock <= 0) {
    this.stockStatus = "out_of_stock";
  } else if (this.stock <= (this.lowStockThreshold || 3)) {
    this.stockStatus = "low_stock";
  } else {
    this.stockStatus = "in_stock";
  }
  next();
});

export default mongoose.model("Product", productSchema);
