import { Router } from "express";
import Order from "../../models/Order.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import KoombiyoDistrict from "../../models/koombiyo/KoombiyoDistrict.js";
import KoombiyoCity from "../../models/koombiyo/KoombiyoCity.js";
import { adminOnly, protect } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { isInitialized, koombiyoPost } from "../../services/koombiyo/koombiyoApiClient.js";
import { createKoombiyoShipment, getKoombiyoWaybills } from "../../services/koombiyo/order.service.js";
import { syncDistricts } from "../../services/koombiyo/district.service.js";
import { syncCities } from "../../services/koombiyo/city.service.js";
import { refreshTracking, syncAllActiveDeliveries } from "../../services/koombiyo/tracking.service.js";
import { requestPickup } from "../../services/koombiyo/pickup.service.js";
import { getReturnNotes, getReturnItems, processReturnReceive } from "../../services/koombiyo/return.service.js";
import { enqueue } from "../../utils/jobQueue.js";
import { sendOrderStatusEmail } from "../../services/emailService.js";
import { getAuditLogs } from "../../services/audit.service.js";

const router = Router();

function requireInit(req, res, next) {
  if (!isInitialized()) {
    res.status(503).json({ message: "Koombiyo integration not initialized" });
    return;
  }
  next();
}

router.post(
  "/shipments/create/:orderId",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await createKoombiyoShipment(req.params.orderId);
    if (!result.success) {
      res.status(400).json({ message: result.error });
      return;
    }

    enqueue(`koombiyo-shipment-${req.params.orderId}`, () =>
      sendOrderStatusEmail(result.order, `Shipment created — Waybill: ${result.waybillId}`)
    );

    res.json({ success: true, message: "Shipment created", ...result });
  })
);

router.get(
  "/shipments/:orderId/tracking",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await refreshTracking(req.params.orderId);
    const freshOrder = await Order.findById(req.params.orderId).select("delivery orderNumber status");
    res.json({
      success: result.success,
      order: freshOrder || null,
      delivery: freshOrder?.delivery || null,
      tracking: result.tracking || null,
      history: result.history || [],
      fullHistory: result.fullHistory || [],
      error: result.error || null
    });
  })
);

router.get(
  "/tracking/customer/:orderId",
  requireInit,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).select("delivery orderNumber customer");
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    const delivery = order.delivery || {};
    if (!delivery.waybillId || !delivery.shipmentCreated) {
      res.json({ tracking: null, delivery: null });
      return;
    }

    await refreshTracking(order._id);
    const freshOrder = await Order.findById(order._id).select("delivery orderNumber");
    res.json({ delivery: freshOrder?.delivery || delivery });
  })
);

router.get(
  "/waybills",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const result = await getKoombiyoWaybills(limit);
    res.json(result);
  })
);

router.post(
  "/districts/sync",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await syncDistricts();
    res.json(result);
  })
);

router.post(
  "/cities/sync/:districtId",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await syncCities(req.params.districtId);
    res.json(result);
  })
);

router.post(
  "/pickup",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const { vehicleType, qty, remarks, pickupAddress, phone, latitude, longitude, orderId } = req.body;
    const result = await requestPickup({
      vehicleType, qty: Number(qty), remarks, pickupAddress, phone,
      latitude: Number(latitude) || 0, longitude: Number(longitude) || 0, orderId
    });
    if (!result.success) {
      res.status(400).json({ message: result.error });
      return;
    }
    res.json(result);
  })
);

router.get(
  "/return-notes",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await getReturnNotes();
    res.json(result);
  })
);

router.get(
  "/return-items/:noteId",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await getReturnItems(req.params.noteId);
    res.json(result);
  })
);

router.post(
  "/return-receive/:waybillId",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await processReturnReceive(req.params.waybillId);
    if (!result.success) {
      res.status(400).json({ message: result.error });
      return;
    }
    res.json(result);
  })
);

router.post(
  "/sync",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const result = await syncAllActiveDeliveries();
    res.json(result);
  })
);

router.get(
  "/dashboard",
  protect,
  adminOnly,
  requireInit,
  asyncHandler(async (req, res) => {
    const waybillResult = await getKoombiyoWaybills(1);
    const availableWaybills = waybillResult.success ? waybillResult.total : 0;
    const activeShipments = await KoombiyoShipment.countDocuments({
      deliveryStatus: { $nin: ["delivered", "cancelled", "returned"] }
    });
    const totalShipments = await KoombiyoShipment.countDocuments();
    const districtCount = await KoombiyoDistrict.countDocuments({ isActive: true });
    const cityCount = await KoombiyoCity.countDocuments({ isActive: true });
    const lastShipment = await KoombiyoShipment.findOne().sort({ createdAt: -1 }).select("createdAt").lean();
    const failedSyncCount = await koombiyoPost("Allorders/users", { limit: 1 }).then(() => 0).catch(() => 1);
    const apiOk = isInitialized();
    res.json({
      apiStatus: apiOk ? "connected" : "disconnected",
      lastSyncTime: lastShipment?.createdAt || null,
      availableWaybills,
      waybillStatus: availableWaybills < 20 ? "low" : availableWaybills < 50 ? "medium" : "good",
      activeShipments,
      totalShipments,
      districtCount,
      cityCount,
      failedSyncCount
    });
  })
);

router.get(
  "/audit-logs",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { action, orderId, limit = 50, skip = 0 } = req.query;
    const result = await getAuditLogs({
      action: action || undefined,
      orderId: orderId || undefined,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    res.json(result);
  })
);

export default router;
