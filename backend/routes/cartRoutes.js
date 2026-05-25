import express from "express";
import { body } from "express-validator";
import { addToCart, getCart, removeCartItem, updateCartItem } from "../controllers/cartController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.get("/", getCart);
router.post("/", [body("productId").isMongoId(), body("quantity").optional().isInt({ min: 1 })], validateRequest, addToCart);
router.patch("/:productId", [body("quantity").isInt({ min: 1 })], validateRequest, updateCartItem);
router.delete("/:productId", removeCartItem);

export default router;
