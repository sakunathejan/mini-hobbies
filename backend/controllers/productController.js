import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildProductQuery } from "../utils/buildProductQuery.js";
import * as cache from "../utils/cache.js";

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "-createdAt";
  const filters = buildProductQuery(req.query);
  const cacheKey = `products:${JSON.stringify({ filters, sort, page, limit })}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const [products, total] = await Promise.all([
    Product.find(filters).populate("category", "name slug").sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filters)
  ]);

  const result = { products, page, pages: Math.ceil(total / limit), total };
  cache.set(cacheKey, result, 30 * 1000);
  res.json(result);
});

export const getFeaturedProducts = asyncHandler(async (_req, res) => {
  const cacheKey = "products:featured";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const products = await Product.find({ featured: true })
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8)
    .lean();

  cache.set(cacheKey, products, 60 * 1000);
  res.json(products);
});

export const getNewArrivals = asyncHandler(async (_req, res) => {
  const cacheKey = "products:new-arrivals";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const products = await Product.find()
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8)
    .lean();

  cache.set(cacheKey, products, 60 * 1000);
  res.json(products);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `product:slug:${req.params.slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug").lean();

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  cache.set(cacheKey, product, 30 * 1000);
  res.json(product);
});

export const getProductById = asyncHandler(async (req, res) => {
  const cacheKey = `product:id:${req.params.id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const product = await Product.findById(req.params.id).populate("category", "name slug").lean();

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  cache.set(cacheKey, product, 30 * 1000);
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
  cache.clear("products:");
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
  cache.clear("products:");
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
  cache.clear("products:");
  res.json({ message: "Product deleted." });
});
