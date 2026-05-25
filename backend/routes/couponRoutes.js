import express from "express";
import { body } from "express-validator";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", validateCoupon);
router.get("/", protect, adminOnly, getCoupons);
router.post(
  "/",
  protect,
  adminOnly,
  [body("code").trim().notEmpty(), body("type").isIn(["percentage", "fixed"]), body("value").isNumeric()],
  validateRequest,
  createCoupon
);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
