import express from "express";
import { body } from "express-validator";
import { getMe, loginAdmin, updateAdminProfile } from "../controllers/authController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { getStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 8 })],
  validateRequest,
  loginAdmin
);
router.get("/me", protect, adminOnly, getMe);
router.put("/profile", protect, adminOnly, updateAdminProfile);
router.get("/dashboard", protect, adminOnly, getStats);

export default router;
