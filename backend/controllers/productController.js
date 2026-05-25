import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildProductQuery } from "../utils/buildProductQuery.js";

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "-createdAt";
  const filters = buildProductQuery(req.query);

  const [products, total] = await Promise.all([
    Product.find(filters).populate("category", "name slug").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filters)
  ]);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

export const getFeaturedProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({ featured: true })
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8);

  res.json(products);
});

export const getNewArrivals = asyncHandler(async (_req, res) => {
  const products = await Product.find()
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8);

  res.json(products);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug");

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  res.json(product);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.variants) {
    data.hasVariants = true;
    data.stock = data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  const product = await Product.create(data);
  const populated = await product.populate("category", "name slug");
  res.status(201).json(populated);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const data = { ...req.body };
  if (data.variants !== undefined) {
    data.hasVariants = data.variants.length > 0;
    if (data.hasVariants) {
      data.stock = data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
  }

  Object.assign(product, data);
  const saved = await product.save();
  res.json(await saved.populate("category", "name slug"));
});

export const decrementStock = async (productId, variantId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) return;

  if (variantId && product.hasVariants) {
    const variant = product.variants.id(variantId);
    if (variant) {
      variant.stock = Math.max(0, variant.stock - quantity);
    }
  } else {
    product.stock = Math.max(0, product.stock - quantity);
  }

  await product.save();
};

export const getLowStockProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({ stockStatus: "low_stock" })
    .populate("category", "name")
    .sort("stock")
    .limit(20);
  res.json(products);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  await product.deleteOne();
  res.json({ message: "Product deleted." });
});
