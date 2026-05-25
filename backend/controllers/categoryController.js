import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort("name");
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
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

  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const productsUsingCategory = await Product.countDocuments({ category: req.params.id });

  if (productsUsingCategory > 0) {
    res.status(400);
    throw new Error("Move products out of this category before deleting it.");
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category deleted." });
});
