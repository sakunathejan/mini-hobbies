import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardStats, getPreOrderDashboardStats } from "../services/dashboardService.js";

export const getStats = asyncHandler(async (_req, res) => {
  const stats = await getDashboardStats();
  res.json(stats);
});

export const getPreOrderStats = asyncHandler(async (_req, res) => {
  const stats = await getPreOrderDashboardStats();
  res.json(stats);
});
