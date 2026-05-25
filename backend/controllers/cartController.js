import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const getSessionId = (req) => req.header("x-session-id") || req.body.sessionId;

export const getCart = asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const cart = await Cart.findOne({ sessionId }).populate("items.product");
  res.json(cart || { sessionId, items: [] });
});

export const addToCart = asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const cart = await Cart.findOneAndUpdate(
    { sessionId },
    { $setOnInsert: { sessionId } },
    { upsert: true, new: true }
  );

  const existing = cart.items.find((item) => item.product.toString() === productId);
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  res.status(201).json(await cart.populate("items.product"));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const cart = await Cart.findOne({ sessionId });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found.");
  }

  const item = cart.items.find((cartItem) => cartItem.product.toString() === req.params.productId);
  if (!item) {
    res.status(404);
    throw new Error("Cart item not found.");
  }

  item.quantity = Number(req.body.quantity);
  await cart.save();
  res.json(await cart.populate("items.product"));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const cart = await Cart.findOne({ sessionId });

  if (!cart) return res.json({ sessionId, items: [] });

  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  res.json(await cart.populate("items.product"));
});
