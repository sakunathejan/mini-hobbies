import express from "express";
import { body } from "express-validator";
import { getWishlist, toggleWishlist } from "../controllers/wishlistController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.get("/", getWishlist);
router.post("/toggle", [body("productId").isMongoId()], validateRequest, toggleWishlist);

export default router;
