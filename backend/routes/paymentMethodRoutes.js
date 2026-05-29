import express from "express";
import { body } from "express-validator";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  getEnabledPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod
} from "../controllers/paymentMethodController.js";

const router = express.Router();

router.get("/enabled", getEnabledPaymentMethods);

router.get("/", protect, adminOnly, getAllPaymentMethods);
router.get("/:id", protect, adminOnly, getPaymentMethodById);

router.post(
  "/",
  protect,
  adminOnly,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("code").trim().notEmpty().withMessage("Code is required"),
  ],
  validateRequest,
  createPaymentMethod
);

router.patch(
  "/:id",
  protect,
  adminOnly,
  updatePaymentMethod
);

router.delete("/:id", protect, adminOnly, deletePaymentMethod);

export default router;
