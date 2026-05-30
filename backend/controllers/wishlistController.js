import Wishlist from "../models/Wishlist.js";
import asyncHandler from "../utils/asyncHandler.js";

const getWishlistScope = (req) => {
  if (req.customer) return { customerId: req.customer._id };
  const sessionId = req.header("x-session-id") || req.body.sessionId;
  return sessionId ? { sessionId } : null;
};

export const getWishlist = asyncHandler(async (req, res) => {
  const scope = getWishlistScope(req);
  if (!scope) return res.json({ products: [] });

  const wishlist = await Wishlist.findOne(scope).populate("products");
  res.json(wishlist || { products: [] });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const scope = getWishlistScope(req);
  if (!scope) {
    res.status(400);
    throw new Error("Unable to identify session.");
  }

  const { productId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    scope,
    { $setOnInsert: scope },
    { upsert: true, new: true }
  );

  const exists = wishlist.products.some((id) => id.toString() === productId);
  wishlist.products = exists
    ? wishlist.products.filter((id) => id.toString() !== productId)
    : [...wishlist.products, productId];

  await wishlist.save();
  res.json(await wishlist.populate("products"));
});

export const mergeWishlist = asyncHandler(async (req, res) => {
  if (!req.customer) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const sessionId = req.body.sessionId;
  if (!sessionId) {
    res.status(400);
    throw new Error("Session ID required for merge.");
  }

  const [sessionWishlist, customerWishlist] = await Promise.all([
    Wishlist.findOne({ sessionId }),
    Wishlist.findOne({ customerId: req.customer._id })
  ]);

  if (!sessionWishlist || sessionWishlist.products.length === 0) {
    const wishlist = customerWishlist || await Wishlist.create({ customerId: req.customer._id, products: [] });
    return res.json(await wishlist.populate("products"));
  }

  const existingIds = new Set(
    (customerWishlist?.products || []).map((id) => id.toString())
  );
  const mergedProducts = [
    ...(customerWishlist?.products || []),
    ...sessionWishlist.products.filter((id) => !existingIds.has(id.toString()))
  ];

  const wishlist = await Wishlist.findOneAndUpdate(
    { customerId: req.customer._id },
    { customerId: req.customer._id, products: mergedProducts },
    { upsert: true, new: true }
  );

  await Wishlist.deleteOne({ sessionId });

  res.json(await wishlist.populate("products"));
});
