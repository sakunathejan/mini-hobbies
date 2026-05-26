import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardStats } from "../services/dashboardService.js";
import * as cache from "../utils/cache.js";

export const getStats = asyncHandler(async (_req, res) => {
  const cached = cache.get("dashboard:stats");
  if (cached) return res.json(cached);
  const stats = await getDashboardStats();
  cache.set("dashboard:stats", stats, 2 * 60 * 1000);
  res.json(stats);
});
