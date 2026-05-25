import express from "express";
import { body } from "express-validator";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  submitBalancePayment,
  submitBankTransferPayment,
  getPayments,
  getPaymentById,
  verifyPayment,
  rejectPayment,
  deletePayment
} from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/bank-transfer",
  protect,
  upload.single("slip"),
  [
    body("orderId").notEmpty(),
    body("bankName").trim().notEmpty(),
    body("accountName").trim().notEmpty(),
    body("accountNumber").trim().notEmpty()
  ],
  validateRequest,
  submitBankTransferPayment
);

router.post(
  "/balance-payment",
  protect,
  upload.single("slip"),
  [body("orderId").notEmpty()],
  validateRequest,
  submitBalancePayment
);

router.get("/", protect, adminOnly, getPayments);
router.get("/:id", protect, adminOnly, getPaymentById);
router.patch("/:id/verify", protect, adminOnly, verifyPayment);
router.patch("/:id/reject", protect, adminOnly, rejectPayment);
router.delete("/:id", protect, adminOnly, deletePayment);

export default router;
