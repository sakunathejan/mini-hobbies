import { Router } from "express";
import { body } from "express-validator";
import { protectCustomer } from "../middleware/customerAuth.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requireActiveAccount } from "./enforcement.js";
import * as ctrl from "./moderationController.js";

const router = Router();

router.get("/my-status", protectCustomer, ctrl.getMyStatus);
router.get("/my-history", protectCustomer, ctrl.getMyHistory);
router.get("/my-appealable", protectCustomer, ctrl.getMyAppealableCases);
router.post(
  "/appeal",
  protectCustomer,
  [body("caseId").notEmpty(), body("message").notEmpty().trim()],
  validateRequest,
  ctrl.submitAppeal,
);

router.get("/admin/cases", protect, adminOnly, ctrl.getAdminCases);
router.get("/admin/stats", protect, adminOnly, ctrl.getAdminStats);
router.get("/admin/cases/:id", protect, adminOnly, ctrl.getAdminCaseDetail);
router.get("/admin/customer-status/:customerId", protect, adminOnly, ctrl.getCustomerStatus);

router.post(
  "/admin/warn",
  protect,
  adminOnly,
  [body("customerId").notEmpty(), body("reason").notEmpty().trim()],
  validateRequest,
  ctrl.warnUser,
);

router.post(
  "/admin/suspend",
  protect,
  adminOnly,
  [
    body("customerId").notEmpty(),
    body("reason").notEmpty().trim(),
    body("duration").isInt({ min: 1 }).withMessage("Duration must be at least 1 hour."),
  ],
  validateRequest,
  ctrl.suspendUser,
);

router.post(
  "/admin/ban",
  protect,
  adminOnly,
  [body("customerId").notEmpty(), body("reason").notEmpty().trim()],
  validateRequest,
  ctrl.banUser,
);

router.post(
  "/admin/lift",
  protect,
  adminOnly,
  [body("customerId").notEmpty()],
  validateRequest,
  ctrl.liftModeration,
);

router.post(
  "/admin/resolve-appeal",
  protect,
  adminOnly,
  [
    body("caseId").notEmpty(),
    body("response").notEmpty().trim(),
    body("action").isIn(["lift", "reject"]),
  ],
  validateRequest,
  ctrl.resolveAppeal,
);

export default router;
