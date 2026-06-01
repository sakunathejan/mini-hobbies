import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { isInitialized, koombiyoPost, buildTrackingUrl } from "../../services/koombiyo/koombiyoApiClient.js";
import { getDistricts, syncDistricts } from "../../services/koombiyo/district.service.js";
import { getCities, syncCities } from "../../services/koombiyo/city.service.js";
import { refreshTracking } from "../../services/koombiyo/tracking.service.js";
import Order from "../../models/Order.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";

const router = Router();

router.get(
  "/districts",
  asyncHandler(async (req, res) => {
    if (!isInitialized()) {
      res.json([]);
      return;
    }
    let districts = await getDistricts();
    const needsSync = !districts || districts.length === 0 || districts.some(d => !d.name);
    if (needsSync) {
      const syncResult = await syncDistricts();
      if (syncResult.success) {
        districts = syncResult.districts;
      }
    }
    res.json(districts);
  })
);

router.get(
  "/cities/:districtId",
  asyncHandler(async (req, res) => {
    if (!isInitialized()) {
      res.json([]);
      return;
    }
    let cities = await getCities(req.params.districtId);
    const needsSync = !cities || cities.length === 0 || cities.some(c => !c.name);
    if (needsSync) {
      const syncResult = await syncCities(req.params.districtId);
      if (syncResult.success) {
        cities = syncResult.cities;
      }
    }
    res.json(cities);
  })
);

router.get(
  "/tracking/:orderId",
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
  "/track/:waybillId",
  asyncHandler(async (req, res) => {
    if (!isInitialized()) {
      res.status(503).json({ message: "Koombiyo not initialized", tracking: null });
      return;
    }
    const { waybillId } = req.params;
    const shipment = await KoombiyoShipment.findOne({ waybillId }).populate("order", "orderNumber customer lifecycleStatus");
    if (!shipment) {
      const trackingData = await koombiyoPost("Allorders/users", { waybillid: waybillId, offset: 0, limit: 1 });
      const orderData = Array.isArray(trackingData?.cust_orders) ? trackingData.cust_orders[0] : trackingData;
      if (!orderData || !orderData.status) {
        res.status(404).json({ message: "Waybill not found", tracking: null });
        return;
      }
      const trackingUrl = buildTrackingUrl(waybillId);
      res.json({
        tracking: {
          waybillId,
          status: orderData.status || "pending",
          label: orderData.status || "",
          location: orderData.location || "",
          estimatedDelivery: orderData.delivery_date || "",
          lastUpdate: orderData.last_update || ""
        },
        trackingUrl,
        orderData
      });
      return;
    }
    if (shipment.order) {
      await refreshTracking(shipment.order._id);
    }
    const freshShipment = await KoombiyoShipment.findOne({ waybillId }).populate("order", "orderNumber customer.name lifecycleStatus delivery");
    const orderData = freshShipment?.order || shipment.order;
    res.json({
      tracking: {
        waybillId,
        status: freshShipment?.deliveryStatus || shipment.deliveryStatus,
        history: freshShipment?.history || shipment.history || []
      },
      trackingUrl: freshShipment?.trackingUrl || shipment.trackingUrl,
      order: orderData ? {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customer?.name,
        status: orderData.lifecycleStatus,
        delivery: orderData.delivery
      } : null
    });
  })
);

export default router;
