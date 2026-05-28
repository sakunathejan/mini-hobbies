import { Router } from "express";
import Order from "../../models/Order.js";
import { adminOnly, protect } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { initKoombiyo, isInitialized } from "./koombiyoClient.js";
import { createShipment } from "./koombiyoService.js";
import { refreshTracking, syncAllActiveDeliveries } from "./koombiyoTrackingService.js";
import { handleWebhook } from "./koombiyoWebhook.js";
import { sanitizeOrderForResponse } from "./koombiyoUtils.js";
import { enqueue } from "../../utils/jobQueue.js";
import { sendOrderStatusEmail } from "../../services/emailService.js";

const router = Router();

router.post(
  "/shipment/create/:orderId",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (order.delivery?.shipmentCreated) {
      res.status(400).json({ message: "Shipment already created for this order" });
      return;
    }

    const result = await createShipment(order);
    if (!result.success) {
      res.status(400).json({ message: result.error });
      return;
    }

    const historyEntry = {
      status: "shipment_created",
      label: "Shipment created",
      timestamp: new Date(),
      raw: result.rawResponse,
    };

    order.delivery = {
      provider: "koombiyo",
      shipmentCreated: true,
      waybillId: result.waybillId,
      trackingUrl: result.trackingUrl,
      deliveryStatus: "pending",
      history: [historyEntry],
      rawResponse: result.rawResponse,
    };

    await order.save();

    enqueue(`koombiyo-shipment-${order._id}`, () =>
      sendOrderStatusEmail(order, `Shipment created — Waybill: ${result.waybillId}`)
    );

    res.json({
      success: true,
      message: "Shipment created",
      order: sanitizeOrderForResponse(order),
    });
  })
);

router.get(
  "/tracking/:orderId",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const delivery = order.delivery || {};
    if (!delivery.waybillId) {
      res.status(400).json({ message: "No waybill ID on this order" });
      return;
    }

    const result = await refreshTracking(order._id);

    const freshOrder = await Order.findById(order._id);
    res.json({
      success: result.success,
      delivery: freshOrder?.delivery || delivery,
      tracking: result.tracking || null,
      history: result.fullHistory || [],
      error: result.error || null,
    });
  })
);

router.get(
  "/tracking/customer/:orderId",
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
    res.json({
      delivery: freshOrder?.delivery || delivery,
    });
  })
);

router.post(
  "/sync",
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    const result = await syncAllActiveDeliveries();
    res.json(result);
  })
);

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    await handleWebhook(req, res);
  })
);

export default router;
