import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { isInitialized } from "../../services/koombiyo/koombiyoApiClient.js";
import { getDistricts, syncDistricts } from "../../services/koombiyo/district.service.js";
import { getCities, syncCities } from "../../services/koombiyo/city.service.js";
import { refreshTracking } from "../../services/koombiyo/tracking.service.js";
import Order from "../../models/Order.js";

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

export default router;
