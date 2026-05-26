import express from "express";
import { uploadProductImages as uploadController } from "../controllers/uploadController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadProductImages, validateFileContent } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/products", protect, adminOnly, uploadProductImages.array("images", 8), validateFileContent(["image/jpeg", "image/png", "image/webp"]), uploadController);

export default router;
