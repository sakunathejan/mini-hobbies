import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";

export const getDashboardStats = async () => {
  const [products, categories, orders, revenue, preOrderCount, preOrderRevenue, pendingDepositsCount, awaitingArrivalCount, readyToShipCount] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.countDocuments({ isPreOrder: true }),
    Order.aggregate([
      { $match: { isPreOrder: true } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]),
    Order.countDocuments({ isPreOrder: true, preOrderStatus: "PRE_ORDER_RESERVED" }),
    Order.countDocuments({ isPreOrder: true, preOrderStatus: { $in: ["PRE_ORDER_CONFIRMED", "PRE_ORDER_ARRIVED"] } }),
    Order.countDocuments({ isPreOrder: true, preOrderStatus: "PRE_ORDER_READY_TO_SHIP" })
  ]);

  return {
    products,
    categories,
    orders,
    revenue: revenue[0]?.total || 0,
    preOrders: preOrderCount,
    totalPreOrders: preOrderCount,
    preOrderRevenue: preOrderRevenue[0]?.total || 0,
    pendingDeposits: pendingDepositsCount,
    awaitingArrival: awaitingArrivalCount,
    readyToShip: readyToShipCount
  };
};

export const getPreOrderDashboardStats = async () => {
  const [
    totalPreOrders,
    pendingDeposits,
    awaitingArrival,
    readyToShip,
    totalRevenue,
    expectedRevenue
  ] = await Promise.all([
    Order.countDocuments({ isPreOrder: true }),
    Order.countDocuments({ isPreOrder: true, preOrderStatus: "PRE_ORDER_RESERVED" }),
    Order.countDocuments({ isPreOrder: true, preOrderStatus: { $in: ["PRE_ORDER_CONFIRMED", "PRE_ORDER_ARRIVED"] } }),
    Order.countDocuments({ isPreOrder: true, preOrderStatus: "PRE_ORDER_READY_TO_SHIP" }),
    Order.aggregate([
      { $match: { isPreOrder: true } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]),
    Order.aggregate([
      { $match: { isPreOrder: true, preOrderStatus: { $nin: ["PRE_ORDER_COMPLETED", "PRE_ORDER_READY_TO_SHIP"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$preOrderInfo.remainingBalance", 0] } } } }
    ])
  ]);

  return {
    totalPreOrders,
    pendingDeposits,
    awaitingArrival,
    readyToShip,
    revenueCollected: totalRevenue[0]?.total || 0,
    expectedRevenue: expectedRevenue[0]?.total || 0
  };
};
