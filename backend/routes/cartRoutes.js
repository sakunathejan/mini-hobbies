import express from "express";
import { body } from "express-validator";
import { addToCart, getCart, mergeCart, removeCartItem, updateCartItem } from "../controllers/cartController.js";
import { optionalCustomer } from "../middleware/customerAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.get("/", optionalCustomer, getCart);
router.post("/", optionalCustomer, [body("productId").isMongoId(), body("quantity").optional().isInt({ min: 1 })], validateRequest, addToCart);
router.patch("/:itemId", optionalCustomer, [body("quantity").isInt({ min: 1 })], validateRequest, updateCartItem);
router.delete("/:itemId", optionalCustomer, removeCartItem);
router.post("/merge", optionalCustomer, [body("sessionId").notEmpty()], validateRequest, mergeCart);

export default router;
