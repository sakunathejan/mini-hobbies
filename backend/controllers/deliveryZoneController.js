import mongoose from "mongoose";
import DeliveryZone from "../models/DeliveryZone.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";
import { parseCSVBuffer } from "../services/csvParserService.js";

export const getDeliveryZones = asyncHandler(async (req, res) => {
  const { from, to, isActive, courierProvider } = req.query;
  const filter = {};
  if (from) filter.normalizedFrom = String(from).toLowerCase().trim();
  if (to) filter.normalizedTo = String(to).toLowerCase().trim();
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (courierProvider) filter.courierProvider = courierProvider;

  const cached = !from && !to && !isActive && !courierProvider ? cache.get("delivery-zones") : null;
  if (cached) return res.json(cached);

  const zones = await DeliveryZone.find(filter).sort("from to").lean();
  cache.set("delivery-zones", zones, 10 * 60 * 1000);
  res.json(zones);
});

export const createDeliveryZone = asyncHandler(async (req, res) => {
  const { from, to, firstKgCharge, additionalKgCharge } = req.body;
  const zone = await DeliveryZone.create({
    from: String(from).trim(),
    to: String(to).trim(),
    firstKgCharge: Number(firstKgCharge),
    additionalKgCharge: Number(additionalKgCharge || 0),
    normalizedFrom: String(from).toLowerCase().trim(),
    normalizedTo: String(to).toLowerCase().trim(),
    courierProvider: String(req.body.courierProvider || "koombiyo").toLowerCase(),
    isActive: true
  });
  cache.clear("delivery-zones"); cache.clear("delivery-cities"); cache.clear("delivery:");
  res.status(201).json(zone);
});

export const updateDeliveryZone = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.from) updateData.normalizedFrom = String(updateData.from).toLowerCase().trim();
  if (updateData.to) updateData.normalizedTo = String(updateData.to).toLowerCase().trim();

  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!zone) {
    res.status(404);
    throw new Error("Delivery zone not found.");
  }
  cache.clear("delivery-zones"); cache.clear("delivery-cities"); cache.clear("delivery:");
  res.json(zone);
});

export const deleteDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
  if (!zone) {
    res.status(404);
    throw new Error("Delivery zone not found.");
  }
  cache.clear("delivery-zones"); cache.clear("delivery-cities"); cache.clear("delivery:");
  res.json({ message: "Delivery zone deleted." });
});

export const bulkDeleteZones = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No zone IDs provided.");
  }
  const result = await DeliveryZone.deleteMany({ _id: { $in: ids } });
  if (result.deletedCount === 0) {
    res.status(404);
    throw new Error("No matching zones found.");
  }
  cache.clear("delivery-zones"); cache.clear("delivery-cities"); cache.clear("delivery:");
  res.json({ message: `${result.deletedCount} zone(s) deleted.`, deletedCount: result.deletedCount });
});

export const importCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("CSV file is required.");
  }

  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    res.status(400);
    throw new Error("File too large. Maximum size is 5MB.");
  }
  if (req.file.size === 0) {
    res.status(400);
    throw new Error("Empty file.");
  }

  const parseResult = parseCSVBuffer(req.file.buffer);

  if (parseResult.rows.length === 0) {
    res.status(400);
    throw new Error("No valid rows found in CSV. All rows were invalid or duplicate.");
  }

  const BATCH_SIZE = 500;
  let importedCount = 0;
  let updatedCount = 0;

  const rows = parseResult.rows;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const bulkOps = [];

    for (const row of batch) {
      bulkOps.push({
        updateOne: {
          filter: {
            normalizedFrom: row.normalizedFrom,
            normalizedTo: row.normalizedTo
          },
          update: {
            $set: {
              from: row.from,
              to: row.to,
              firstKgCharge: row.firstKgCharge,
              additionalKgCharge: row.additionalKgCharge,
              courierProvider: row.courierProvider,
              normalizedFrom: row.normalizedFrom,
              normalizedTo: row.normalizedTo,
              importedAt: new Date(),
              sourceFile: req.file.originalname,
              isActive: true
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      try {
        const result = await DeliveryZone.bulkWrite(bulkOps, { ordered: false });
        importedCount += result.upsertedCount || 0;
        updatedCount += result.modifiedCount || 0;
      } catch (bulkErr) {
        if (bulkErr.writeErrors) {
          importedCount += bulkErr.result?.upsertedCount || 0;
          updatedCount += bulkErr.result?.modifiedCount || 0;
        } else {
          throw bulkErr;
        }
      }
    }
  }

  const totalCount = await DeliveryZone.countDocuments();

  const report = {
    totalRows: parseResult.totalRows,
    imported: importedCount,
    updated: updatedCount,
    skipped: parseResult.invalidRows.length,
    invalid: parseResult.invalidRows.length,
    duplicate: 0,
    totalZones: totalCount,
    invalidRows: parseResult.invalidRows.slice(0, 50),
    sourceFile: req.file.originalname
  };

  if (req.user) {
    AuditLog.create({
      admin: req.user._id,
      action: "delivery-zones.import",
      resource: "DeliveryZone",
      details: { report, file: req.file.originalname, fileName: req.file.originalname },
      ip: req.ip,
      userAgent: req.get("user-agent")?.slice(0, 255)
    }).catch(() => {});
  }

  cache.clear("delivery-zones"); cache.clear("delivery-cities"); cache.clear("delivery:");
  res.json(report);
});

export const getImportHistory = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({ action: "delivery-zones.import" })
    .sort("-createdAt")
    .limit(20)
    .populate("admin", "name email")
    .lean();

  res.json(
    logs.map((log) => ({
      _id: log._id,
      admin: log.admin,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      ip: log.ip
    }))
  );
});

export const toggleZoneActive = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findById(req.params.id);
  if (!zone) {
    res.status(404);
    throw new Error("Delivery zone not found.");
  }
  zone.isActive = !zone.isActive;
  await zone.save();
  cache.clear("delivery-zones"); cache.clear("delivery-cities"); cache.clear("delivery:");
  res.json(zone);
});

export const getZoneStats = asyncHandler(async (_req, res) => {
  const cached = cache.get("delivery-zones:stats");
  if (cached) return res.json(cached);

  const [totalZones, activeZones, latestImport, origins, providers] = await Promise.all([
    DeliveryZone.countDocuments(),
    DeliveryZone.countDocuments({ isActive: true }),
    AuditLog.findOne({ action: "delivery-zones.import" }).sort("-createdAt").lean(),
    DeliveryZone.distinct("normalizedFrom"),
    DeliveryZone.distinct("courierProvider")
  ]);

  const counts = await DeliveryZone.aggregate([
    { $match: { courierProvider: { $in: providers } } },
    { $group: { _id: "$courierProvider", count: { $sum: 1 } } }
  ]);
  const zonesByProvider = {};
  for (const c of counts) zonesByProvider[c._id] = c.count;

  const result = {
    totalZones,
    activeZones,
    origins: origins.sort(),
    latestImport: latestImport || null,
    zonesByProvider
  };
  cache.set("delivery-zones:stats", result, 5 * 60 * 1000);
  res.json(result);
});
