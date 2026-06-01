import KoombiyoPickupRequest from "../../models/koombiyo/KoombiyoPickupRequest.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import Order from "../../models/Order.js";
import { koombiyoPost, isInitialized } from "./koombiyoApiClient.js";

export async function requestPickup({ vehicleType, qty, remarks, pickupAddress, phone, latitude, longitude, orderId }) {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized" };

  if (!vehicleType || !qty || !pickupAddress || !phone) {
    return { success: false, error: "Missing required fields" };
  }

  const payload = {
    vehicleType,
    qty: Number(qty),
    pickup_remark: remarks || "",
    pickup_address: pickupAddress,
    phone,
    latitude: latitude || 0,
    longitude: longitude || 0
  };

  try {
    const response = await koombiyoPost("Pickups/users", payload);

    if (orderId) {
      await KoombiyoPickupRequest.create({
        order: orderId,
        waybillId: "",
        vehicleType,
        quantity: Number(qty),
        pickupAddress,
        phone,
        remarks: remarks || "",
        latitude: latitude || 0,
        longitude: longitude || 0,
        rawResponse: response,
        success: true
      });

      await KoombiyoShipment.findOneAndUpdate(
        { order: orderId },
        { $set: { lastPickupRequestAt: new Date(), pickupResponse: response } }
      );

      await Order.findByIdAndUpdate(orderId, {
        $set: { "delivery.lastPickupRequest": new Date(), "delivery.pickupResponse": response }
      });
    }

    return { success: true, rawResponse: response };
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Pickup request failed";

    if (orderId) {
      await KoombiyoPickupRequest.create({
        order: orderId,
        vehicleType,
        quantity: Number(qty),
        pickupAddress,
        phone,
        remarks: remarks || "",
        success: false,
        errorMessage: msg
      });
    }

    console.error("[Koombiyo] requestPickup error:", msg);
    return { success: false, error: msg };
  }
}

export async function getPickupRequests(filters = {}) {
  return KoombiyoPickupRequest.find(filters).sort("-requestedAt").lean();
}
