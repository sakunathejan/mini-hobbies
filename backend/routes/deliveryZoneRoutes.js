import express from "express";
import { body } from "express-validator";
import multer from "multer";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  bulkDeleteZones,
  importCSV,
  getImportHistory,
  toggleZoneActive,
  getZoneStats
} from "../controllers/deliveryZoneController.js";

const router = express.Router();

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["text/csv", "application/vnd.ms-excel", "application/csv", "text/plain"];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed."));
    }
  }
});

router.get("/", getDeliveryZones);
router.get("/stats", getZoneStats);
router.get("/import-history", getImportHistory);
router.post(
  "/import",
  protect,
  adminOnly,
  csvUpload.single("file"),
  importCSV
);
router.post(
  "/",
  protect,
  adminOnly,
  [body("from").trim().notEmpty(), body("to").trim().notEmpty(), body("firstKgCharge").isNumeric()],
  validateRequest,
  createDeliveryZone
);
router.put("/:id", protect, adminOnly, updateDeliveryZone);
router.post("/bulk-delete", protect, adminOnly, bulkDeleteZones);
router.patch("/:id/toggle", protect, adminOnly, toggleZoneActive);
router.delete("/:id", protect, adminOnly, deleteDeliveryZone);

export default router;
