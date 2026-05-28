import { Router } from "express";
import { body } from "express-validator";
import { protect, adminOnly } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  warnUser, suspendUser, banUser, liftUserModeration,
  getUserModerationHistory, getAllCases,
  approveAppeal, rejectAppeal, deleteAppealCase, removeCase,
  setAppealStatus, createAppealNote, appealStats,
} from "../controllers/moderationController.js";

const router = Router();
router.use(protect, adminOnly);

router.get("/cases", getAllCases);
router.get("/cases/:id", getUserModerationHistory);
router.get("/appeals/stats", appealStats);

router.post("/:id/warn",
  [body("reason").trim().notEmpty().withMessage("Reason is required")],
  validateRequest,
  warnUser
);

router.post("/:id/suspend",
  [body("reason").trim().notEmpty().withMessage("Reason is required")],
  validateRequest,
  suspendUser
);

router.post("/:id/ban",
  [body("reason").trim().notEmpty().withMessage("Reason is required")],
  validateRequest,
  banUser
);

router.post("/:id/lift", liftUserModeration);
router.delete("/:id", removeCase);

router.post("/appeals/:caseId/approve", approveAppeal);
router.post("/appeals/:caseId/reject", rejectAppeal);
router.delete("/appeals/:caseId", deleteAppealCase);
router.patch("/appeals/:caseId/status", setAppealStatus);
router.post("/appeals/:caseId/notes", createAppealNote);

export default router;