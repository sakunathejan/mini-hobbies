import express from "express";
import { body } from "express-validator";
import {
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getLowStockProducts,
  getNewArrivals,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductTypes,
  updateProduct,
  transitionPreOrderStatus,
  getPreOrderLifecycle,
  extendPreOrderDeadline,
  getPreOrderAnalyticsHandler,
  getComputedPreOrderAnalyticsHandler
} from "../controllers/productController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

const productRules = [
  body("name").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("category").isMongoId(),
  body("price").isFloat({ min: 0 }),
  body("stock").isInt({ min: 0 })
];

router.get("/", getProducts);
router.get("/product-types", getProductTypes);
router.get("/featured", getFeaturedProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/pre-order/analytics", protect, adminOnly, getPreOrderAnalyticsHandler);
router.get("/pre-order/analytics/computed", protect, adminOnly, getComputedPreOrderAnalyticsHandler);
router.get("/low-stock", protect, adminOnly, getLowStockProducts);
router.get("/admin/:id", protect, adminOnly, getProductById);
router.get("/:slug", getProductBySlug);
router.post("/", protect, adminOnly, productRules, validateRequest, createProduct);
router.put("/:id", protect, adminOnly, productRules, validateRequest, updateProduct);
router.post("/:id/pre-order/transition", protect, adminOnly, transitionPreOrderStatus);
router.get("/:id/pre-order/lifecycle", protect, adminOnly, getPreOrderLifecycle);
router.post("/:id/pre-order/extend-deadline", protect, adminOnly, extendPreOrderDeadline);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
