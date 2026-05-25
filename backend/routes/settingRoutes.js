import express from "express";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { getAllSettings, getSetting, updateSetting } from "../controllers/settingController.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAllSettings);
router.get("/:key", getSetting);
router.put("/:key", protect, adminOnly, updateSetting);

export default router;
