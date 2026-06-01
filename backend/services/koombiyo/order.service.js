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
import { addTimelineEntry } from "../../helpers/orderTimeline.js";
import { logAudit } from "../audit.service.js";

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

function validateCodAmount(order, codResult) {
  const pm = (order.paymentMethod || "").toLowerCase();
  const ps = (order.paymentStatus || "").toLowerCase();

  if (ps === "paid" && codResult.codAmount !== 0) {
    return { valid: false, error: `Payment status is PAID but COD amount is ${codResult.codAmount}. Must be 0.` };
  }

  if (pm === "cod" && codResult.codAmount === 0) {
    return { valid: false, error: "Payment method is COD but COD amount is 0. Must equal total." };
  }

  if (pm !== "cod" && codResult.codAmount > 0) {
    return { valid: false, error: `Payment method is ${pm} but COD amount is ${codResult.codAmount}. Must be 0 for prepaid orders.` };
  }

  return { valid: true };
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

  console.log(`[Koombiyo] createKoombiyoShipment for order ${order.orderNumber}: paymentMethod="${order.paymentMethod}" paymentStatus="${order.paymentStatus}" paymentType="${order.paymentType}" status="${order.status}" lifecycleStatus="${order.lifecycleStatus}" total=${order.total}`);

  const codResult = calculateCOD(order);
  console.log(`[Koombiyo] calculateCOD result:`, JSON.stringify(codResult));

  if (!codResult.success) {
    return { success: false, error: codResult.error };
  }

  const validation = validateCodAmount(order, codResult);
  if (!validation.valid) {
    console.error(`[Koombiyo] COD validation FAILED for ${order.orderNumber}: ${validation.error}`);
    await logAudit({
      action: "LOCATION_VALIDATION_FAILED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { error: validation.error, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, codAmount: codResult.codAmount }
    });
    return { success: false, error: validation.error };
  }

  const customer = order.customer || {};
  const districtId = order.districtId;
  const cityId = order.cityId;

  const districtCheck = await validateDistrictExists(districtId);
  if (!districtCheck.valid) {
    await logAudit({
      action: "LOCATION_VALIDATION_FAILED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { error: `Invalid district: ${districtCheck.error}`, districtId }
    });
    return { success: false, error: `Invalid district: ${districtCheck.error}` };
  }

  const cityCheck = await validateCityInDistrict(cityId, districtId);
  if (!cityCheck.valid) {
    await logAudit({
      action: "LOCATION_VALIDATION_FAILED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { error: `Invalid city: ${cityCheck.error}`, cityId, districtId }
    });
    return { success: false, error: `Invalid city: ${cityCheck.error}` };
  }

  const districtCode = districtCheck.district.districtId;
  const cityCode = cityCheck.city.cityId;

  let waybillId;
  try {
    waybillId = await getNextWaybill();
    console.log("[Koombiyo] Allocated waybill ID:", waybillId);
    await logAudit({
      action: "WAYBILL_ALLOCATED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: { waybillId }
    });
  } catch (err) {
    console.error("[Koombiyo] Waybill allocation failed:", err.message);
    return { success: false, error: err.message };
  }

  const items = order.items || [];
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
    getCod: codResult.getCod
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
    order.productValue = codResult.productValue;
    order.deliveryCharge = codResult.deliveryCharge;
    order.codAmount = codResult.codAmount;
    order.codTotal = codResult.getCod;
    order.lifecycleStatus = ORDER_STATUS.SHIPPED;
    order.status = LIFECYCLE_TO_LEGACY[ORDER_STATUS.SHIPPED] || order.status;
    order.shippedAt = new Date();
    order.lastSyncAt = new Date();

    addTimelineEntry(order, ORDER_STATUS.SHIPPED, {
      note: `Shipment created via Koombiyo. Waybill: ${waybillId}. ${codResult.alreadyPaid ? "Prepaid" : `COD: LKR ${codResult.codAmount}`}`,
      source: "system"
    });

    if (order.statusHistory) {
      order.statusHistory.push({
        status: ORDER_STATUS.SHIPPED,
        note: `Shipment created via Koombiyo. Waybill: ${waybillId}`,
        updatedAt: new Date()
      });
    }

    await order.save({ validateModifiedOnly: true });
    cache.clear(`koombiyo:tracking:${order._id}`);

    await logAudit({
      action: "SHIPMENT_CREATED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      details: {
        waybillId,
        codAmount: codResult.codAmount,
        paymentMethod: codResult.paymentMethod,
        paymentStatus: codResult.paymentStatus,
        alreadyPaid: codResult.alreadyPaid
      }
    });

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
    lifecycleStatus: order.lifecycleStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    codAmount: order.codAmount,
    delivery: order.delivery
  };
}
