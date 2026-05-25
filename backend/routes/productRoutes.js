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
  updateProduct
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
router.get("/featured", getFeaturedProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/low-stock", protect, adminOnly, getLowStockProducts);
router.get("/admin/:id", protect, adminOnly, getProductById);
router.get("/:slug", getProductBySlug);
router.post("/", protect, adminOnly, productRules, validateRequest, createProduct);
router.put("/:id", protect, adminOnly, productRules, validateRequest, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
