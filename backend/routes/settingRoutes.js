import express from "express";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { getSetting, updateSetting } from "../controllers/settingController.js";

const router = express.Router();

router.get("/:key", getSetting);
router.put("/:key", protect, adminOnly, updateSetting);

export default router;
