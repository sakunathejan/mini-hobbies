import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardStats, getPreOrderDashboardStats } from "../services/dashboardService.js";
import { getPreOrderAnalytics } from "../services/preOrderStateMachine.js";

export const getStats = asyncHandler(async (_req, res) => {
  const stats = await getDashboardStats();
  res.json(stats);
});

export const getPreOrderStats = asyncHandler(async (_req, res) => {
  const [orderStats, lifecycleStats] = await Promise.all([
    getPreOrderDashboardStats(),
    getPreOrderAnalytics()
  ]);
  res.json({ ...orderStats, ...lifecycleStats });
});
