import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";

export const getCategories = asyncHandler(async (_req, res) => {
  const cached = cache.get("categories");
  if (cached) return res.json(cached);

  const categories = await Category.find().sort("name").lean();
  const categoryIds = categories.map((c) => c._id);

  const productCounts = await Product.aggregate([
    { $match: { category: { $in: categoryIds } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = {};
  productCounts.forEach((p) => { countMap[String(p._id)] = p.count; });

  const data = categories.map((c) => ({
    ...c,
    productCount: countMap[String(c._id)] || 0,
  }));

  cache.set("categories", data, 5 * 60 * 1000);
  res.json(data);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  cache.clear("categories");
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found.");
  }

  cache.clear("categories");
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const productsUsingCategory = await Product.countDocuments({ category: req.params.id });

  if (productsUsingCategory > 0) {
    res.status(400);
    throw new Error("Move products out of this category before deleting it.");
  }

  await Category.findByIdAndDelete(req.params.id);
  cache.clear("categories");
  res.json({ message: "Category deleted." });
});
