import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { protectCustomer } from "../../middleware/customerAuth.js";
import { adminOnly } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { requireActiveAccount } from "../../moderation/enforcement.js";
import * as ctrl from "../controllers/reviewReplyController.js";

const router = Router();

router.get("/:reviewId", asyncHandler(ctrl.getReplies));

router.post("/", protectCustomer, requireActiveAccount, asyncHandler(ctrl.createReply));

router.put("/:id", protectCustomer, requireActiveAccount, asyncHandler(ctrl.editReply));

router.delete("/:id", protectCustomer, requireActiveAccount, asyncHandler(ctrl.deleteReply));

router.delete("/admin/:id", protect, adminOnly, asyncHandler(ctrl.deleteReplyAdmin));

export default router;
