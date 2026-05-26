import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeOrder } from "../utils/normalizeOrder.js";

export const getMyOrders = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const { page = 1, limit = 10, status, paymentMethod, search, sort = "-createdAt" } = req.query;

  const filter = { "customer.email": customer.email.toLowerCase().trim() };

  if (status) filter.status = { $regex: `^${status}$`, $options: "i" };
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "items.name": { $regex: search, $options: "i" } },
    ];
  }

  const sortMap = {
    newest: "-createdAt",
    oldest: "createdAt",
    highest: "-total",
    lowest: "total",
  };
  const sortBy = sortMap[sort] || sort;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sortBy).skip(skip).limit(limitNum).populate("payment").lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders: orders.map(normalizeOrder),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const customer = req.customer;

  const order = await Order.findOne({
    _id: req.params.id,
    "customer.email": customer.email.toLowerCase().trim(),
  }).populate("payment").lean();

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  res.json(normalizeOrder(order));
});
