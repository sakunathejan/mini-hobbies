import { Router } from "express";
import { body, query } from "express-validator";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  getUsers,
  getUserById,
  updateUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  resetUserPassword,
  verifyUserEmail,
  forceLogoutUser,
  addAdminNote,
  getUserOrders,
  getUserLoginHistory,
  bulkSuspendUsers,
  bulkActivateUsers,
  bulkDeleteUsers,
  exportUsers,
  getUserStats,
} from "../controllers/adminUserController.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/stats", getUserStats);
router.get("/export", exportUsers);
router.get("/", [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().trim(),
  query("status").optional().isIn(["active", "suspended", "banned"]),
  query("verified").optional().isIn(["true", "false"]),
  query("sortBy").optional().isIn(["createdAt", "name", "email", "lastLoginAt", "loginAttempts", "status"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
], validateRequest, getUsers);

router.get("/:id", getUserById);
router.get("/:id/orders", [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
], validateRequest, getUserOrders);
router.get("/:id/login-history", [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
], validateRequest, getUserLoginHistory);

router.patch("/:id", [
  body("name").optional().trim().notEmpty(),
  body("phone").optional().trim(),
  body("email").optional().isEmail().normalizeEmail(),
  body("avatar").optional().trim(),
  body("preferences").optional().isObject(),
], validateRequest, updateUser);

router.post("/:id/suspend", suspendUser);
router.post("/:id/reactivate", reactivateUser);
router.delete("/:id", deleteUser);

router.post("/:id/reset-password", [
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
], validateRequest, resetUserPassword);

router.post("/:id/verify-email", [
  body("verified").isBoolean().withMessage("Verified must be a boolean."),
], validateRequest, verifyUserEmail);

router.post("/:id/force-logout", forceLogoutUser);

router.post("/:id/notes", [
  body("text").trim().notEmpty().withMessage("Note text is required."),
], validateRequest, addAdminNote);

router.post("/bulk-suspend", [
  body("ids").isArray({ min: 1 }).withMessage("At least one ID is required."),
], validateRequest, bulkSuspendUsers);

router.post("/bulk-activate", [
  body("ids").isArray({ min: 1 }).withMessage("At least one ID is required."),
], validateRequest, bulkActivateUsers);

router.post("/bulk-delete", [
  body("ids").isArray({ min: 1 }).withMessage("At least one ID is required."),
], validateRequest, bulkDeleteUsers);

export default router;
