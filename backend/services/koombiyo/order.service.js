import Order from "../../models/Order.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import { koombiyoPost, isInitialized, buildTrackingUrl } from "./koombiyoApiClient.js";
import { getDistrictById } from "./district.service.js";
import { getCityById } from "./city.service.js";
import * as cache from "../../utils/cache.js";
import { ORDER_STATUS, isTerminal, LIFECYCLE_TO_LEGACY } from "../../constants/orderStatus.js";
import { emit, EVENTS } from "../event.service.js";
import { sendShipmentCreatedEmail } from "../email/email.service.js";
import { calculateCOD } from "../codCalculator.service.js";
import { validateCityInDistrict, validateDistrictExists } from "../../middleware/validateLocation.js";

function sanitizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/\D/g, "").replace(/^0/, "94");
}

function sanitizeText(t) {
  return String(t)
    .replace(/['"\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\w\s,.+\[\]-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getNextWaybill() {
  try {
    const response = await koombiyoPost("Waybils/users", { limit: 1 });
    const waybills = response?.waybills;
    if (!Array.isArray(waybills) || waybills.length === 0) {
      throw new Error("No available waybills");
    }
    return String(waybills[0].waybill_id);
  } catch (err) {
    throw new Error(`Failed to allocate waybill: ${err.message}`);
  }
}

function buildDescription(items) {
  if (!Array.isArray(items) || items.length === 0) return "Order items";
  const parts = items.slice(0, 5).map((i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity}`);
  if (items.length > 5) parts.push(`+${items.length - 5} more`);
  return sanitizeText(parts.join(", "));
}

export async function createKoombiyoShipment(orderId) {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized" };

  const order = await Order.findById(orderId);
  if (!order) return { success: false, error: "Order not found" };
  if (order.delivery?.shipmentCreated) return { success: false, error: "Shipment already exists" };

  const currentStatus = order.lifecycleStatus || ORDER_STATUS.PENDING;
  if (isTerminal(currentStatus)) {
    return { success: false, error: `Cannot create shipment for order in ${currentStatus} status` };
  }

  const customer = order.customer || {};
  const districtId = order.districtId;
  const cityId = order.cityId;

  const districtCheck = await validateDistrictExists(districtId);
  if (!districtCheck.valid) {
    return { success: false, error: `Invalid district: ${districtCheck.error}` };
  }

  const cityCheck = await validateCityInDistrict(cityId, districtId);
  if (!cityCheck.valid) {
    return { success: false, error: `Invalid city: ${cityCheck.error}` };
  }

  const districtCode = districtCheck.district.districtId;
  const cityCode = cityCheck.city.cityId;

  const items = order.items || [];

  const totalProductValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const deliveryCharge = order.deliveryFee || 0;
  const codResult = calculateCOD({ productValue: totalProductValue, deliveryCharge });
  const getCod = codResult.success ? codResult.codTotal : 0;

  let waybillId;
  try {
    waybillId = await getNextWaybill();
    console.log("[Koombiyo] Allocated waybill ID:", waybillId);
  } catch (err) {
    console.error("[Koombiyo] Waybill allocation failed:", err.message);
    return { success: false, error: err.message };
  }

  const payload = {
    orderWaybillid: waybillId,
    orderNo: order.orderNumber || String(order._id),
    receiverName: sanitizeText(customer.name || ""),
    receiverStreet: sanitizeText(customer.address || ""),
    receiverDistrict: districtCode,
    receiverCity: cityCode,
    receiverPhone: (customer.phone || "").replace(/\D/g, ""),
    description: buildDescription(items),
    spclNote: sanitizeText(order.notes || ""),
    getCod
  };

  try {
    console.log("[Koombiyo] Sending AddNewOrder payload:", JSON.stringify(payload));
    const response = await koombiyoPost("Addorders/users", payload);
    console.log("[Koombiyo] AddNewOrder response:", JSON.stringify(response).slice(0, 500));
    const trackingUrl = buildTrackingUrl(waybillId, customer.phone);

    const historyEntry = {
      status: "pending",
      label: "Shipment created",
      timestamp: new Date(),
      source: "api",
      raw: response
    };

    const shipment = await KoombiyoShipment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      waybillId,
      trackingUrl,
      deliveryStatus: "pending",
      shipmentCreatedAt: new Date(),
      lastTrackingSyncAt: new Date(),
      receiverDistrict: districtCode,
      receiverCity: cityCode,
      rawCreateResponse: response,
      history: [historyEntry]
    });

    order.delivery = {
      provider: "koombiyo",
      shipmentCreated: true,
      shipmentId: shipment._id,
      waybillId,
      trackingUrl,
      deliveryStatus: "pending",
      shipmentCreatedAt: new Date(),
      lastTrackingSyncAt: new Date(),
      history: [historyEntry]
    };

    order.districtId = districtCode;
    order.cityId = cityCode;
    order.koombiyoWaybillId = waybillId;
    order.isKoombiyoActive = true;
    order.productValue = totalProductValue;
    order.deliveryCharge = deliveryCharge;
    order.codTotal = getCod;
    order.lifecycleStatus = ORDER_STATUS.SHIPPED;
    order.status = LIFECYCLE_TO_LEGACY[ORDER_STATUS.SHIPPED] || order.status;
    order.shippedAt = new Date();
    order.lastSyncAt = new Date();

    if (order.statusHistory) {
      order.statusHistory.push({
        status: ORDER_STATUS.SHIPPED,
        note: `Shipment created via Koombiyo. Waybill: ${waybillId}`,
        updatedAt: new Date()
      });
    }

    await order.save({ validateModifiedOnly: true });
    cache.clear(`koombiyo:tracking:${order._id}`);

    emit(EVENTS.ORDER_SHIPPED, { order, waybillId, trackingUrl });

    sendShipmentCreatedEmail(order, waybillId, trackingUrl).catch(err => {
      console.error("[Koombiyo] Shipment email failed:", err.message);
    });

    return { success: true, waybillId, trackingUrl, shipment, order: sanitizeOrder(order) };
  } catch (err) {
    const detail = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error("[Koombiyo] createShipment error:", detail);
    console.error("[Koombiyo] Payload was:", JSON.stringify(payload));
    const msg = err?.response?.data?.message || err.message || "Koombiyo create order failed";
    return { success: false, error: msg };
  }
}

export async function getKoombiyoWaybills(limit = 50) {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized", waybills: [], total: 0 };

  try {
    const response = await koombiyoPost("Waybils/users", { limit: Number(limit) });
    const waybills = Array.isArray(response?.waybills) ? response.waybills : [];
    return { success: true, waybills, total: waybills.length };
  } catch (err) {
    console.error("[Koombiyo] getWaybills error:", err.message);
    return { success: false, error: err.message, waybills: [], total: 0 };
  }
}

function sanitizeOrder(order) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    delivery: order.delivery
  };
}
