import express from "express";
import { body } from "express-validator";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload, validateFileContent } from "../middleware/uploadMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  getAnnouncements,
  getActiveAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  bulkDeleteAnnouncements,
  bulkUpdateAnnouncements,
  duplicateAnnouncement,
  trackAnnouncementClick,
  trackAnnouncementDismissal,
  getCategories,
  getAnnouncementStats
} from "../controllers/announcementController.js";

const router = express.Router();

router.get("/active", getActiveAnnouncements);
router.get("/categories", getCategories);
router.post("/:id/click", trackAnnouncementClick);
router.post("/:id/dismiss", trackAnnouncementDismissal);

router.get("/stats", protect, adminOnly, getAnnouncementStats);
router.get("/", protect, adminOnly, getAnnouncements);
router.get("/:id", protect, adminOnly, getAnnouncementById);

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  validateFileContent(["image/jpeg", "image/png", "image/webp"]),
  [
    body("title").trim().notEmpty().withMessage("Title is required."),
    body("content").trim().notEmpty().withMessage("Content is required."),
    body("type").optional().isIn(["banner", "popup", "toast"]).withMessage("Invalid type."),
    body("priority").optional().isIn(["low", "normal", "high", "urgent"]).withMessage("Invalid priority."),
    body("status").optional().isIn(["draft", "scheduled", "published"]).withMessage("Invalid status."),
    body("audience").optional().isIn(["all", "users", "guests"]).withMessage("Invalid audience."),
    body("expiresAt").optional({ values: "null" }).isISO8601().withMessage("Invalid expiry date."),
    body("publishAt").optional({ values: "null" }).isISO8601().withMessage("Invalid publish date.")
  ],
  validateRequest,
  createAnnouncement
);

router.post("/bulk-delete", protect, adminOnly, [
  body("ids").isArray({ min: 1 }).withMessage("IDs array is required.")
], validateRequest, bulkDeleteAnnouncements);

router.post("/bulk-update", protect, adminOnly, [
  body("ids").isArray({ min: 1 }).withMessage("IDs array is required."),
  body("changes").isObject().withMessage("Changes object is required.")
], validateRequest, bulkUpdateAnnouncements);

router.post("/:id/duplicate", protect, adminOnly, duplicateAnnouncement);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  validateFileContent(["image/jpeg", "image/png", "image/webp"]),
  [
    body("title").optional().trim().notEmpty().withMessage("Title cannot be empty."),
    body("content").optional().trim().notEmpty().withMessage("Content cannot be empty."),
    body("type").optional().isIn(["banner", "popup", "toast"]).withMessage("Invalid type."),
    body("priority").optional().isIn(["low", "normal", "high", "urgent"]).withMessage("Invalid priority."),
    body("status").optional().isIn(["draft", "scheduled", "published", "archived"]).withMessage("Invalid status."),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean."),
    body("audience").optional().isIn(["all", "users", "guests"]).withMessage("Invalid audience."),
    body("expiresAt").optional({ values: "null" }).isISO8601().withMessage("Invalid expiry date."),
    body("publishAt").optional({ values: "null" }).isISO8601().withMessage("Invalid publish date.")
  ],
  validateRequest,
  updateAnnouncement
);

router.delete("/:id", protect, adminOnly, deleteAnnouncement);

export default router;
