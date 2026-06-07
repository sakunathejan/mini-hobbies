import Product from "../models/Product.js";
import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildProductQuery } from "../utils/buildProductQuery.js";
import * as cache from "../utils/cache.js";
import { transitionPreOrder, getPreOrderAnalytics, getComputedPreOrderAnalytics } from "../services/preOrderStateMachine.js";
import { getProductLifecycleStatus } from "../utils/preOrderStatusResolver.js";

const addStatus = (product) => {
  if (!product) return product;
  return { ...product, status: getProductLifecycleStatus(product) };
};

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "-createdAt";
  const filters = buildProductQuery(req.query);
  const cacheKey = `products:${JSON.stringify({ filters, sort, page, limit })}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, products: cached.products.map(addStatus) });

  const [products, total] = await Promise.all([
    Product.find(filters).populate("category", "name slug").sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filters)
  ]);

  const result = { products: products.map(addStatus), page, pages: Math.ceil(total / limit), total };
  cache.set(cacheKey, result, 30 * 1000);
  res.json(result);
});

export const getFeaturedProducts = asyncHandler(async (_req, res) => {
  const cacheKey = "products:featured";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached.map(addStatus));

  const products = await Product.find({ featured: true })
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8)
    .lean();

  cache.set(cacheKey, products, 60 * 1000);
  res.json(products.map(addStatus));
});

export const getNewArrivals = asyncHandler(async (_req, res) => {
  const cacheKey = "products:new-arrivals";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached.map(addStatus));

  const products = await Product.find()
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8)
    .lean();

  cache.set(cacheKey, products, 60 * 1000);
  res.json(products.map(addStatus));
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `product:slug:${req.params.slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(addStatus(cached));

  const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug").lean();

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  cache.set(cacheKey, product, 30 * 1000);
  res.json(addStatus(product));
});

export const getProductById = asyncHandler(async (req, res) => {
  const cacheKey = `product:id:${req.params.id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(addStatus(cached));

  const product = await Product.findById(req.params.id).populate("category", "name slug").lean();

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  cache.set(cacheKey, product, 30 * 1000);
  res.json(addStatus(product));
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (Array.isArray(data.variants) && data.variants.length > 0) {
    data.hasVariants = true;
    data.stock = data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  } else {
    data.hasVariants = false;
    data.variants = [];
  }
  const product = await Product.create(data);
  const populated = await product.populate("category", "name slug");
  cache.clear("products:");
  res.status(201).json(addStatus(populated.toObject()));
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
  const populated = await saved.populate("category", "name slug");
  res.json(addStatus(populated.toObject()));
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
  res.json(products.map(addStatus));
});

export const getProductTypes = asyncHandler(async (_req, res) => {
  res.json({
    types: ["IN_STOCK", "PRE_ORDER", "OUT_OF_STOCK"]
  });
});

export const transitionPreOrderStatus = asyncHandler(async (req, res) => {
  const { toState, note } = req.body;
  const trigger = req.user?.role === "admin" ? "admin" : "system";
  const result = await transitionPreOrder(req.params.id, toState, { trigger, note: note || "" });
  cache.clear("products:");
  res.json({ ...result, status: getProductLifecycleStatus(result.product) });
});

export const getPreOrderLifecycle = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("preOrderStatus preOrderClosedAt preOrderArrivedAt preOrderDelayedAt preOrderCancelledAt preOrderDeadline preOrderExpectedDate preOrderDelayNote preOrderDelayExpectedDate preOrderLog preOrderSoldCount preOrderLimit productType").lean();
  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }
  res.json(addStatus(product));
});

export const extendPreOrderDeadline = asyncHandler(async (req, res) => {
  const { newDeadline } = req.body;
  if (!newDeadline) {
    res.status(400);
    throw new Error("New deadline is required.");
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }
  if (product.productType !== "PRE_ORDER") {
    res.status(400);
    throw new Error("Product is not a pre-order.");
  }
  product.preOrderDeadline = new Date(newDeadline);
  await product.save();
  cache.clear("products:");
  res.json({ message: "Deadline updated.", product: addStatus(product.toObject()) });
});

export const getPreOrderAnalyticsHandler = asyncHandler(async (_req, res) => {
  const stats = await getPreOrderAnalytics();
  res.json(stats);
});

export const getComputedPreOrderAnalyticsHandler = asyncHandler(async (_req, res) => {
  const stats = await getComputedPreOrderAnalytics();
  res.json(stats);
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

export { addStatus };
