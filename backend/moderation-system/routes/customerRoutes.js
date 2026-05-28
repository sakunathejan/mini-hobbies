import { Router } from "express";
import { body } from "express-validator";
import { protectCustomer } from "../../middleware/customerAuth.js";
import { requireActiveAccount } from "../middleware/enforcement.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { getMyStatus, getMyHistory, submitMyAppeal } from "../controllers/customerController.js";

const router = Router();

router.get("/status", protectCustomer, getMyStatus);
router.get("/history", protectCustomer, requireActiveAccount, getMyHistory);

router.post("/appeal",
  protectCustomer,
  [body("message").trim().notEmpty().withMessage("Appeal message is required")],
  validateRequest,
  submitMyAppeal
);

export default router;
