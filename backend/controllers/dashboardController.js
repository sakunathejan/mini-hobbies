import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardStats } from "../services/dashboardService.js";
import * as cache from "../utils/cache.js";
import Order from "../models/Order.js";

export const getStats = asyncHandler(async (_req, res) => {
  cache.del("dashboard:stats");
  const stats = await getDashboardStats();
  const orderCount = await Order.countDocuments();
  console.log(`[DASHBOARD] Fresh stats: orders=${stats.orders}, revenue=${stats.revenue}, rawOrderCount=${orderCount}`);
  res.json(stats);
});
