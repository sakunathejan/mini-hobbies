import express from "express";
import { body } from "express-validator";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  seedDeliveryZones,
  bulkUpdateZones
} from "../controllers/deliveryZoneController.js";

const router = express.Router();

router.get("/", getDeliveryZones);
router.post(
  "/",
  protect,
  adminOnly,
  [body("district").trim().notEmpty(), body("fee").isNumeric()],
  validateRequest,
  createDeliveryZone
);
router.put("/:id", protect, adminOnly, updateDeliveryZone);
router.delete("/:id", protect, adminOnly, deleteDeliveryZone);
router.post("/seed", protect, adminOnly, seedDeliveryZones);
router.post("/bulk-update", protect, adminOnly, bulkUpdateZones);

export default router;
