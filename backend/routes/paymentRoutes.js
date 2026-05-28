import express from "express";
import { body } from "express-validator";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload, validateFileContent } from "../middleware/uploadMiddleware.js";
import {
  submitBalancePayment,
  submitBankTransferPayment,
  getPayments,
  getPaymentById,
  verifyPayment,
  rejectPayment,
  deletePayment,
  bulkDeletePayments
} from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/bank-transfer",
  upload.single("slip"),
  validateFileContent(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
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
  upload.single("slip"),
  validateFileContent(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  [body("orderId").notEmpty()],
  validateRequest,
  submitBalancePayment
);

router.get("/", protect, adminOnly, getPayments);
router.get("/:id", protect, adminOnly, getPaymentById);
router.patch("/:id/verify", protect, adminOnly, verifyPayment);
router.patch("/:id/reject", protect, adminOnly, rejectPayment);
router.delete("/:id", protect, adminOnly, deletePayment);
router.post("/bulk-delete", protect, adminOnly, bulkDeletePayments);

export default router;
