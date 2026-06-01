import KoombiyoReturn from "../../models/koombiyo/KoombiyoReturn.js";
import KoombiyoShipment from "../../models/koombiyo/KoombiyoShipment.js";
import Order from "../../models/Order.js";
import { koombiyoPost, isInitialized } from "./koombiyoApiClient.js";

export async function getReturnNotes() {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized", notes: [] };

  try {
    const response = await koombiyoPost("Returnnotes/users");
    const notes = Array.isArray(response) ? response : [];
    return { success: true, notes };
  } catch (err) {
    console.error("[Koombiyo] getReturnNotes error:", err.message);
    return { success: false, error: err.message, notes: [] };
  }
}

export async function getReturnItems(noteId) {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized", items: [] };

  try {
    const response = await koombiyoPost("Returnitems/users", { noteId: noteId });
    const items = Array.isArray(response) ? response : [];
    return { success: true, items };
  } catch (err) {
    console.error("[Koombiyo] getReturnItems error:", err.message);
    return { success: false, error: err.message, items: [] };
  }
}

export async function processReturnReceive(waybillId) {
  if (!isInitialized()) return { success: false, error: "Koombiyo not initialized" };

  try {
    const response = await koombiyoPost("Returnreceive/users", { orderWaybillid: waybillId });
    const now = new Date();

    await KoombiyoReturn.findOneAndUpdate(
      { waybillId },
      { $set: { receivedAt: now, status: "received", rawResponse: response } },
      { upsert: true }
    );

    await KoombiyoShipment.findOneAndUpdate(
      { waybillId },
      { $set: { deliveryStatus: "returned", returnReceivedAt: now } }
    );

    await Order.findOneAndUpdate(
      { "delivery.waybillId": waybillId },
      { $set: { "delivery.deliveryStatus": "returned", "delivery.returnReceivedAt": now } }
    );

    return { success: true, rawResponse: response };
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Return receive failed";
    console.error("[Koombiyo] processReturnReceive error:", msg);
    return { success: false, error: msg };
  }
}

export async function getStoredReturns() {
  return KoombiyoReturn.find().sort("-createdAt").lean();
}
