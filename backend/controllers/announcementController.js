import Announcement from "../models/Announcement.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";
import { uploadAnnouncementImage } from "../services/supabaseStorageService.js";

const CACHE_KEY = "announcements:";

const publishIfScheduled = async () => {
  const now = new Date();
  await Announcement.updateMany(
    { status: "scheduled", publishAt: { $lte: now } },
    { $set: { status: "published", isActive: true } }
  );
};

const archiveIfExpired = async () => {
  const now = new Date();
  await Announcement.updateMany(
    { status: "published", expiresAt: { $lte: now } },
    { $set: { status: "archived", isActive: false } }
  );
};

export const getAnnouncements = asyncHandler(async (req, res) => {
  await publishIfScheduled();
  await archiveIfExpired();

  const {
    page = 1,
    limit = 20,
    search,
    status,
    priority,
    category,
    type: filterType,
    sort = "-createdAt"
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (filterType) query.type = filterType;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.min(Number(limit), 100);
  const limitNum = Math.min(Number(limit), 100);

  const [announcements, total] = await Promise.all([
    Announcement.find(query).sort(sort).skip(skip).limit(limitNum).populate("createdBy", "name email").lean(),
    Announcement.countDocuments(query)
  ]);

  res.json({
    announcements,
    pagination: {
      page: Math.max(1, Number(page)),
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

export const getActiveAnnouncements = asyncHandler(async (_req, res) => {
  await publishIfScheduled();
  await archiveIfExpired();

  const now = new Date();
  const announcements = await Announcement.find({
    isActive: true,
    status: "published",
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }]
  }).sort("-priority createdAt").lean();
  res.json(announcements);
});

export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate("createdBy", "name email").lean();
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found.");
  }
  res.json(announcement);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, type, priority, status, category, ctaText, ctaUrl, audience, publishAt, expiresAt } = req.body;
  let image = null;
  if (req.file) {
    const upload = await uploadAnnouncementImage(req.file);
    image = upload.url;
  }

  const isActive = status === "published" && (!publishAt || new Date(publishAt) <= new Date());

  const announcement = await Announcement.create({
    title: title.trim(),
    content: sanitizeHtml(content),
    image,
    type: type || "banner",
    priority: priority || "normal",
    status: status || "draft",
    category: category || "general",
    ctaText: ctaText || null,
    ctaUrl: ctaUrl || null,
    audience: audience || "all",
    publishAt: publishAt || null,
    expiresAt: expiresAt || null,
    isActive,
    createdBy: req.user._id
  });

  await AuditLog.create({
    admin: req.user._id,
    action: "create",
    resource: "announcement",
    resourceId: announcement._id,
    details: { title: announcement.title },
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  cache.clear(CACHE_KEY);
  res.status(201).json(announcement);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, type, priority, status, category, ctaText, ctaUrl, audience, publishAt, expiresAt, isActive } = req.body;
  const update = {};

  if (title !== undefined) update.title = title.trim();
  if (content !== undefined) update.content = sanitizeHtml(content);
  if (type !== undefined) update.type = type;
  if (priority !== undefined) update.priority = priority;
  if (status !== undefined) update.status = status;
  if (category !== undefined) update.category = category;
  if (ctaText !== undefined) update.ctaText = ctaText;
  if (ctaUrl !== undefined) update.ctaUrl = ctaUrl;
  if (audience !== undefined) update.audience = audience;
  if (publishAt !== undefined) update.publishAt = publishAt || null;
  if (expiresAt !== undefined) update.expiresAt = expiresAt || null;
  if (isActive !== undefined) update.isActive = isActive;
  if (req.body.image === "null" || req.body.image === "") update.image = null;

  if (req.file) {
    const upload = await uploadAnnouncementImage(req.file);
    update.image = upload.url;
  }

  if (status === "published" && !publishAt) {
    update.isActive = true;
  }

  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found.");
  }

  await AuditLog.create({
    admin: req.user._id,
    action: "update",
    resource: "announcement",
    resourceId: announcement._id,
    details: { changes: Object.keys(update) },
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  cache.clear(CACHE_KEY);
  res.json(announcement);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found.");
  }

  await AuditLog.create({
    admin: req.user._id,
    action: "delete",
    resource: "announcement",
    resourceId: req.params.id,
    details: { title: announcement.title },
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  cache.clear(CACHE_KEY);
  res.json({ message: "Announcement deleted successfully." });
});

export const bulkDeleteAnnouncements = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No announcement IDs provided.");
  }
  const result = await Announcement.deleteMany({ _id: { $in: ids } });

  await AuditLog.create({
    admin: req.user._id,
    action: "bulk_delete",
    resource: "announcement",
    details: { count: result.deletedCount, ids },
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  cache.clear(CACHE_KEY);
  res.json({ message: `${result.deletedCount} announcement(s) deleted.`, deletedCount: result.deletedCount });
});

export const bulkUpdateAnnouncements = asyncHandler(async (req, res) => {
  const { ids, changes } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No announcement IDs provided.");
  }

  const safeChanges = {};
  const allowedFields = ["status", "isActive", "priority", "category", "type", "audience"];
  for (const key of allowedFields) {
    if (changes[key] !== undefined) safeChanges[key] = changes[key];
  }

  if (Object.keys(safeChanges).length === 0) {
    res.status(400);
    throw new Error("No valid changes provided.");
  }

  const result = await Announcement.updateMany(
    { _id: { $in: ids } },
    { $set: safeChanges }
  );

  await AuditLog.create({
    admin: req.user._id,
    action: "bulk_update",
    resource: "announcement",
    details: { count: result.modifiedCount, ids, changes: safeChanges },
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  cache.clear(CACHE_KEY);
  res.json({ message: `${result.modifiedCount} announcement(s) updated.`, modifiedCount: result.modifiedCount });
});

export const duplicateAnnouncement = asyncHandler(async (req, res) => {
  const source = await Announcement.findById(req.params.id);
  if (!source) {
    res.status(404);
    throw new Error("Announcement not found.");
  }

  const clone = await Announcement.create({
    title: `${source.title} (Copy)`,
    content: source.content,
    image: source.image,
    type: source.type,
    priority: source.priority,
    status: "draft",
    category: source.category,
    ctaText: source.ctaText,
    ctaUrl: source.ctaUrl,
    audience: source.audience,
    createdBy: req.user._id
  });

  cache.clear(CACHE_KEY);
  res.status(201).json(clone);
});

export const trackAnnouncementClick = asyncHandler(async (req, res) => {
  const result = await Announcement.findByIdAndUpdate(
    req.params.id,
    { $inc: { clicks: 1 } },
    { new: false }
  );
  if (!result) {
    res.status(404);
    throw new Error("Announcement not found.");
  }
  res.json({ success: true });
});

export const trackAnnouncementDismissal = asyncHandler(async (req, res) => {
  const result = await Announcement.findByIdAndUpdate(
    req.params.id,
    { $inc: { dismissals: 1 } },
    { new: false }
  );
  if (!result) {
    res.status(404);
    throw new Error("Announcement not found.");
  }
  res.json({ success: true });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Announcement.distinct("category", { category: { $ne: null } });
  res.json(categories.sort());
});

export const getAnnouncementStats = asyncHandler(async (_req, res) => {
  const [total, byStatus, byType, totalViews, totalClicks, totalDismissals] = await Promise.all([
    Announcement.countDocuments(),
    Announcement.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Announcement.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]),
    Announcement.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    Announcement.aggregate([{ $group: { _id: null, total: { $sum: "$clicks" } } }]),
    Announcement.aggregate([{ $group: { _id: null, total: { $sum: "$dismissals" } } }])
  ]);

  res.json({
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byType: Object.fromEntries(byType.map((t) => [t._id, t.count])),
    totalViews: totalViews[0]?.total || 0,
    totalClicks: totalClicks[0]?.total || 0,
    totalDismissals: totalDismissals[0]?.total || 0
  });
});
