import express from "express";
import { body } from "express-validator";
import {
  createOrder,
  deleteOrder,
  deleteOrders,
  getOrderById,
  getOrders,
  retryWhatsApp,
  trackOrder,
  updateOrderStatus
} from "../controllers/orderController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload, validateFileContent } from "../middleware/uploadMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

const orderStatuses = [
  "Pending Advance Payment",
  "Pending Payment Verification",
  "Advance Payment Submitted",
  "Payment Confirmed",
  "Advance Payment Confirmed",
  "Awaiting Final Payment",
  "Fully Paid",
  "Preparing Order",
  "Shipped", "Delivered", "Cancelled"
];

router.post(
  "/",
  upload.single("paymentSlip"),
  validateFileContent(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  (req, _res, next) => {
    if (typeof req.body.customer === "string") {
      try { req.body.customer = JSON.parse(req.body.customer); } catch {}
    }
    if (typeof req.body.items === "string") {
      try { req.body.items = JSON.parse(req.body.items); } catch {}
    }
    next();
  },
  [
    body("customer.name").trim().notEmpty(),
    body("customer.email").isEmail(),
    body("customer.phone").trim().notEmpty(),
    body("customer.address").trim().notEmpty(),
    body("customer.district").optional().trim(),
    body("paymentMethod").optional().isIn(["bank_transfer", "cod", "advance"]),
    body("items").isArray({ min: 1 }),
    body("couponCode").optional().trim()
  ],
  validateRequest,
  createOrder
);

router.get("/track/:orderNumber", trackOrder);
router.get("/", protect, adminOnly, getOrders);
router.get("/:id", protect, adminOnly, getOrderById);
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  [body("status").isIn(orderStatuses), body("note").optional().trim(), body("trackingNumber").optional().trim()],
  validateRequest,
  updateOrderStatus
);

router.post("/:id/retry-whatsapp", protect, adminOnly, retryWhatsApp);
router.delete("/:id", protect, adminOnly, deleteOrder);
router.post("/delete-bulk", protect, adminOnly, deleteOrders);

export default router;
