import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const getCartScope = (req) => {
  if (req.customer) return { customerId: req.customer._id };
  const sessionId = req.header("x-session-id") || req.body.sessionId;
  return sessionId ? { sessionId } : null;
};

export const getCart = asyncHandler(async (req, res) => {
  const scope = getCartScope(req);
  if (!scope) return res.json({ items: [] });

  const cart = await Cart.findOne(scope).populate("items.product");
  res.json(cart || { items: [] });
});

export const addToCart = asyncHandler(async (req, res) => {
  const scope = getCartScope(req);
  if (!scope) {
    res.status(400);
    throw new Error("Unable to identify cart session.");
  }

  const { productId, quantity = 1, variantId = "" } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const selectedVariant = variantId ? product.variants?.find((v) => v._id.toString() === variantId) : null;
  const variantName = selectedVariant?.name || "";
  const variantImage = selectedVariant?.image?.url || "";

  const cart = await Cart.findOneAndUpdate(
    scope,
    { $setOnInsert: scope },
    { upsert: true, new: true }
  );

  if (variantId) {
    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && !item.variantId)
    );
  }

  const existing = cart.items.find(
    (item) => item.product.toString() === productId && (item.variantId || "") === variantId
  );
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity, variantId, variantName, variantImage });
  }

  await cart.save();
  res.status(201).json(await cart.populate("items.product"));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const scope = getCartScope(req);
  if (!scope) {
    res.status(400);
    throw new Error("Unable to identify cart session.");
  }

  const cart = await Cart.findOne(scope);
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found.");
  }

  const itemId = req.params.itemId;
  const variantId = req.body.variantId || "";
  let item;
  try { item = cart.items.id(itemId); } catch {}
  if (!item) {
    item = cart.items.find(
      (i) => i.product.toString() === itemId && (i.variantId || "") === variantId
    );
  }
  if (!item) {
    res.status(404);
    throw new Error("Cart item not found.");
  }

  item.quantity = Number(req.body.quantity);
  await cart.save();
  res.json(await cart.populate("items.product"));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const scope = getCartScope(req);
  if (!scope) return res.json({ items: [] });

  const cart = await Cart.findOne(scope);
  if (!cart) return res.json({ items: [] });

  const itemId = req.params.itemId;
  const variantId = (req.query.variantId || req.body.variantId || "").toString();

  let target;
  try { target = cart.items.id(itemId); } catch {}
  if (!target) {
    target = cart.items.find(
      (i) => i.product.toString() === itemId && (i.variantId || "") === variantId
    );
  }

  if (!target) {
    const current = await Cart.findById(cart._id).populate("items.product");
    return res.json(current || { items: [] });
  }

  const pullFilter = { product: target.product };
  if (target.variantId) {
    pullFilter.variantId = target.variantId;
  } else {
    pullFilter.variantId = { $in: [null, ""] };
  }

  await Cart.updateOne({ _id: cart._id }, { $pull: { items: pullFilter } });

  const updated = await Cart.findById(cart._id).populate("items.product");
  res.json(updated || { items: [] });
});

export const mergeCart = asyncHandler(async (req, res) => {
  if (!req.customer) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const sessionId = req.body.sessionId;
  if (!sessionId) {
    res.status(400);
    throw new Error("Session ID required for merge.");
  }

  const [sessionCart, customerCart] = await Promise.all([
    Cart.findOne({ sessionId }),
    Cart.findOne({ customerId: req.customer._id })
  ]);

  if (!sessionCart || sessionCart.items.length === 0) {
    const cart = customerCart || await Cart.create({ customerId: req.customer._id, items: [] });
    return res.json(await cart.populate("items.product"));
  }

  const mergedItems = [...(customerCart?.items || [])];
  for (const sessionItem of sessionCart.items) {
    const existing = mergedItems.find(
      (item) => item.product.toString() === sessionItem.product.toString() && (item.variantId || "") === (sessionItem.variantId || "")
    );
    if (existing) {
      existing.quantity += sessionItem.quantity;
    } else {
      mergedItems.push(sessionItem);
    }
  }

  const cart = await Cart.findOneAndUpdate(
    { customerId: req.customer._id },
    { customerId: req.customer._id, items: mergedItems },
    { upsert: true, new: true }
  );

  await Cart.deleteOne({ sessionId });

  res.json(await cart.populate("items.product"));
});
