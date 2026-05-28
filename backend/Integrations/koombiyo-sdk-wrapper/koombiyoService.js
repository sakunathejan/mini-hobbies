import { Koombiyo, isInitialized } from "./koombiyoClient.js";
import { mapDistrict, mapCity, validateAddress } from "./koombiyoMapper.js";
import { buildOrderRequest, mapKoombiyoStatus } from "./koombiyoUtils.js";

async function createShipment(order) {
  if (!isInitialized()) {
    console.warn("[Koombiyo] SDK not initialized — skipping shipment creation");
    return { success: false, error: "Koombiyo SDK not initialized" };
  }

  try {
    const customer = order.customer || {};
    const addressErrors = validateAddress(customer);
    if (addressErrors.length > 0) {
      return { success: false, error: addressErrors.join("; ") };
    }

    const district = customer.district?.trim() || "Colombo";
    const districtCode = mapDistrict(district);
    const cityCode = mapCity(district);
    if (!districtCode) {
      return { success: false, error: `Unsupported district: "${district}"` };
    }

    const req = {
      ...buildOrderRequest(order),
      district_id: districtCode,
      city_id: cityCode || districtCode,
    };

    const response = await Koombiyo.AddNewOrder(req);

    let waybillId = "";
    if (response?.order) {
      waybillId = String(response.order.order_id || response.order.waybillid || "");
    }

    const trackingUrl = waybillId
      ? Koombiyo.GenerateTrackingURL(waybillId, customer.phone)
      : "";

    return {
      success: true,
      waybillId,
      trackingUrl,
      rawResponse: response,
    };
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Unknown Koombiyo error";
    console.error("[Koombiyo] createShipment failed:", msg);
    return { success: false, error: msg };
  }
}

async function trackShipment(waybillId) {
  if (!isInitialized()) {
    console.warn("[Koombiyo] SDK not initialized — skipping tracking");
    return { success: false, error: "Koombiyo SDK not initialized" };
  }

  if (!waybillId) {
    return { success: false, error: "No waybill ID provided" };
  }

  try {
    const tracking = await Koombiyo.GetTrackOrderById(waybillId);
    const history = await Koombiyo.GetOrderHistory(waybillId);

    return {
      success: true,
      tracking: {
        status: tracking?.status || "",
        statusLabel: mapKoombiyoStatus(tracking?.status),
        location: tracking?.location || "",
        estimatedDelivery: tracking?.delivery_date || "",
        lastUpdate: tracking?.last_update || "",
      },
      history: Array.isArray(history)
        ? history.map((h) => ({
            status: h.status || "",
            date: h.date || h.created_at || "",
            location: h.location || "",
            note: h.remark || h.note || "",
          }))
        : [],
      rawResponse: { tracking, history },
    };
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Failed to track shipment";
    console.error("[Koombiyo] trackShipment failed:", msg);
    return { success: false, error: msg };
  }
}

export { createShipment, trackShipment };
