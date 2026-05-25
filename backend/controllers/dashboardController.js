import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardStats } from "../services/dashboardService.js";

export const getStats = asyncHandler(async (_req, res) => {
  res.json(await getDashboardStats());
});
