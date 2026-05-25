import Coupon from "../models/Coupon.js";
import asyncHandler from "../utils/asyncHandler.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error("Invalid or expired coupon code.");
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    res.status(400);
    throw new Error("This coupon has expired.");
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("This coupon has reached its usage limit.");
  }

  if (subtotal < coupon.minOrder) {
    res.status(400);
    throw new Error(`Minimum order of LKR ${coupon.minOrder.toLocaleString("en-LK")} required for this coupon.`);
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }

  res.json({ valid: true, coupon, discount });
});

export const getCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }
  res.json({ message: "Coupon deleted." });
});
