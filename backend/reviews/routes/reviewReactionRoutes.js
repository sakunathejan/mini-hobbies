import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { protectCustomer } from "../../middleware/customerAuth.js";
import { adminOnly } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { requireActiveAccount } from "../../moderation/enforcement.js";
import * as ctrl from "../controllers/reviewReactionController.js";

const router = Router();

router.get("/summary/:reviewId", asyncHandler(ctrl.getReactionSummary));

router.post("/toggle", protectCustomer, requireActiveAccount, asyncHandler(ctrl.toggleReaction));

router.get("/admin/stats", protect, adminOnly, asyncHandler(ctrl.getEngagementStats));

router.delete("/admin/remove", protect, adminOnly, asyncHandler(ctrl.removeReactionAdmin));

export default router;
