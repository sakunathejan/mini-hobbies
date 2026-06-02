import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeOrder } from "../utils/normalizeOrder.js";

export const debugMyOrders = asyncHandler(async (req, res) => {
  if (!req.customer) {
    res.status(401); throw new Error("Authentication required.");
  }
  const escapedEmail = req.customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const byCustomerId = await Order.find({ customerId: req.customer._id }).lean().limit(20).sort({ createdAt: -1 });
  const byEmail = await Order.find({ "customer.email": { $regex: `^${escapedEmail}$`, $options: "i" } }).lean().limit(20).sort({ createdAt: -1 });
  const allIds = new Set([...byCustomerId, ...byEmail].map(o => o._id.toString()));
  const allOrders = await Order.find({ _id: { $in: [...allIds] } }).lean().sort({ createdAt: -1 });
  res.json({
    customerId: req.customer._id,
    customerEmail: req.customer.email,
    byCustomerIdCount: byCustomerId.length,
    byEmailCount: byEmail.length,
    totalOrdersOnAccount: allOrders.length,
    orders: allOrders.map(o => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerEmail: o.customer?.email,
      createdAt: o.createdAt,
      status: o.status,
    })),
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.customer) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  console.log(`[CUSTOMER ORDERS] getMyOrders: customerId=${req.customer._id}`);

  const { page = 1, limit = 10, status, paymentMethod, search, sort = "-createdAt" } = req.query;

  const escapedEmail = req.customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const orConditions = [
    { customerId: req.customer._id },
    { "customer.email": { $regex: `^${escapedEmail}$`, $options: "i" } },
  ];

  const filter = {};
  if (status) filter.status = { $regex: `^${status}$`, $options: "i" };
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (search) {
    orConditions.push(
      { orderNumber: { $regex: search, $options: "i" } },
      { "items.name": { $regex: search, $options: "i" } },
    );
  }
  filter.$or = orConditions;

  console.log(`[GET MY ORDERS] customerId=${req.customer._id}, customerEmail=${req.customer.email}, filter=${JSON.stringify(filter)}`);

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

  console.log(`[GET MY ORDERS RESULT] total=${total}, orderNumbers=${orders.map(o => o.orderNumber).join(",")}`);

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
  if (!req.customer) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const escapedEmail = req.customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const order = await Order.findOne({
    _id: req.params.id,
    $or: [
      { customerId: req.customer._id },
      { "customer.email": { $regex: `^${escapedEmail}$`, $options: "i" } },
    ],
  }).populate("payment").lean();

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  res.json(normalizeOrder(order));
});
