import Wishlist from "../models/Wishlist.js";
import asyncHandler from "../utils/asyncHandler.js";

const getSessionId = (req) => req.header("x-session-id") || req.body.sessionId;

export const getWishlist = asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const wishlist = await Wishlist.findOne({ sessionId }).populate("products");
  res.json(wishlist || { sessionId, products: [] });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const { productId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    { sessionId },
    { $setOnInsert: { sessionId } },
    { upsert: true, new: true }
  );

  const exists = wishlist.products.some((id) => id.toString() === productId);
  wishlist.products = exists
    ? wishlist.products.filter((id) => id.toString() !== productId)
    : [...wishlist.products, productId];

  await wishlist.save();
  res.json(await wishlist.populate("products"));
});
