import express from "express";
import { body } from "express-validator";
import { getWishlist, mergeWishlist, toggleWishlist } from "../controllers/wishlistController.js";
import { optionalCustomer } from "../middleware/customerAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.get("/", optionalCustomer, getWishlist);
router.post("/toggle", optionalCustomer, [body("productId").isMongoId()], validateRequest, toggleWishlist);
router.post("/merge", optionalCustomer, [body("sessionId").notEmpty()], validateRequest, mergeWishlist);

export default router;
