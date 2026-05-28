import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { protectCustomer } from "../../middleware/customerAuth.js";
import { adminOnly, auditLog } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { requireActiveCustomer, checkSpamAndAbuse } from "../middleware/reviewGuard.js";
import * as ctrl from "../controllers/reviewController.js";

const router = Router();

// Public — product reviews
router.get("/product/:productId", asyncHandler(ctrl.getProductReviews));

// Customer — my reviews
router.get("/mine", protectCustomer, requireActiveCustomer, asyncHandler(ctrl.getCustomerReviews));
router.post("/", protectCustomer, requireActiveCustomer, checkSpamAndAbuse, asyncHandler(ctrl.createReview));
router.put("/:id", protectCustomer, requireActiveCustomer, asyncHandler(ctrl.editReview));
router.delete("/:id", protectCustomer, requireActiveCustomer, asyncHandler(ctrl.deleteReview));

// Admin — review management
router.get("/admin", protect, adminOnly, asyncHandler(ctrl.getAdminReviews));
router.put("/admin/:id/approve", protect, adminOnly, auditLog("approve_review", "Review"), asyncHandler(ctrl.approveReview));
router.put("/admin/:id/reject", protect, adminOnly, auditLog("reject_review", "Review"), asyncHandler(ctrl.rejectReview));
router.put("/admin/:id/feature", protect, adminOnly, auditLog("feature_review", "Review"), asyncHandler(ctrl.featureReview));
router.post("/admin/:id/respond", protect, adminOnly, auditLog("respond_review", "Review"), asyncHandler(ctrl.respondToReview));
router.delete("/admin/:id", protect, adminOnly, auditLog("delete_review", "Review"), asyncHandler(ctrl.deleteReviewAdmin));

export default router;
