import DeliveryZone from "../models/DeliveryZone.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDeliveryZones = asyncHandler(async (_req, res) => {
  const zones = await DeliveryZone.find().sort("district");
  res.json(zones);
});

export const createDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.create(req.body);
  res.status(201).json(zone);
});

export const updateDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!zone) {
    res.status(404);
    throw new Error("Delivery zone not found.");
  }
  res.json(zone);
});

export const deleteDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
  if (!zone) {
    res.status(404);
    throw new Error("Delivery zone not found.");
  }
  res.json({ message: "Delivery zone deleted." });
});

export const seedDeliveryZones = asyncHandler(async (_req, res) => {
  const existing = await DeliveryZone.countDocuments();
  if (existing > 0) {
    return res.status(400).json({ message: "Zones already exist. Delete them first to re-seed." });
  }

  const defaults = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
    "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
    "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Moneragala",
    "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
    "Trincomalee", "Vavuniya"
  ];

  const zones = await DeliveryZone.insertMany(
    defaults.map((d) => ({ district: d, fee: 650, codAvailable: true, estimatedDays: "3-5 business days" }))
  );

  res.status(201).json(zones);
});

export const bulkUpdateZones = asyncHandler(async (req, res) => {
  const { fee, estimatedDays } = req.body;
  const update = {};
  if (fee !== undefined && fee !== null && !isNaN(Number(fee))) update.fee = Number(fee);
  if (estimatedDays !== undefined && estimatedDays !== null && String(estimatedDays).trim()) update.estimatedDays = String(estimatedDays).trim();
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "Provide at least fee or estimatedDays to update." });
  }
  const result = await DeliveryZone.updateMany({}, { $set: update });
  const zones = await DeliveryZone.find().sort("district");
  res.json({ zones, modifiedCount: result.modifiedCount });
});
