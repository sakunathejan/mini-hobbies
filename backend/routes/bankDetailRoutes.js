import { Router } from "express";
import { getBankDetails, upsertBankDetails } from "../controllers/bankDetailController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getBankDetails);
router.post("/", protect, adminOnly, upsertBankDetails);

export default router;