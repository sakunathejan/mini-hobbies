import crypto from "crypto";
import bcrypt from "bcryptjs";
import asyncHandler from "../utils/asyncHandler.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import LoginHistory from "../models/LoginHistory.js";

const createAuditLog = (req, action, resource, resourceId, details = {}) =>
  AuditLog.create({
    admin: req.user._id,
    action,
    resource,
    resourceId: String(resourceId),
    details,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = (req.query.search || "").trim();
  const status = req.query.status || "";
  const verified = req.query.verified || "";
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  const filter = { deletedAt: null };

  if (status && ["active", "suspended", "banned"].includes(status)) {
    filter.status = status;
  }

  if (verified === "true") filter.emailVerified = true;
  else if (verified === "false") filter.emailVerified = false;

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
    ];
  }

  const allowedSorts = ["createdAt", "name", "email", "lastLoginAt", "loginAttempts", "status"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "createdAt";

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .select("-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -refreshTokenHistory")
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  const customerIds = customers.map((c) => c._id);

  const [orderCounts, spendingData] = await Promise.all([
    Order.aggregate([
      { $match: { "customer.email": { $in: customers.map((c) => c.email) } } },
      { $group: { _id: "$customer.email", count: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { "customer.email": { $in: customers.map((c) => c.email) } } },
      { $group: { _id: "$customer.email", totalSpent: { $sum: "$total" } } },
    ]),
  ]);

  const orderCountMap = {};
  orderCounts.forEach((o) => { orderCountMap[o._id] = o.count; });
  const spendingMap = {};
  spendingData.forEach((s) => { spendingMap[s._id] = s.totalSpent; });

  const data = customers.map((c) => ({
    ...c,
    orderCount: orderCountMap[c.email] || 0,
    totalSpent: spendingMap[c.email] || 0,
  }));

  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getUserById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .select("-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -refreshTokenHistory");
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  const [orderCount, totalSpent, recentOrders, loginHistory] = await Promise.all([
    Order.countDocuments({ "customer.email": customer.email }),
    Order.aggregate([
      { $match: { "customer.email": customer.email } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.find({ "customer.email": customer.email })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    LoginHistory.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  res.json({
    ...customer.toObject(),
    orderCount,
    totalSpent: totalSpent[0]?.total || 0,
    recentOrders,
    loginHistory,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, avatar, email, preferences } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (avatar !== undefined) customer.avatar = avatar;
  if (email !== undefined) {
    const existing = await Customer.findOne({ email, _id: { $ne: customer._id }, deletedAt: null });
    if (existing) {
      res.status(409); throw new Error("Email already in use.");
    }
    customer.email = email;
    customer.emailVerified = false;
  }
  if (preferences !== undefined) {
    customer.preferences = { ...customer.preferences.toObject?.() || customer.preferences, ...preferences };
  }

  await customer.save();

  await createAuditLog(req, "update-customer", "Customer", customer._id, {
    changes: req.body,
  });

  const sanitized = await Customer.findById(customer._id)
    .select("-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -refreshTokenHistory");

  res.json(sanitized);
});

export const suspendUser = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }
  if (customer.status === "suspended") {
    res.status(400); throw new Error("Customer is already suspended.");
  }

  customer.status = "suspended";
  customer.statusChangedAt = new Date();
  customer.statusChangedBy = req.user._id;
  await customer.save();

  await createAuditLog(req, "suspend-customer", "Customer", customer._id, {
    previousStatus: "active",
    newStatus: "suspended",
  });

  res.json({ message: "Customer suspended successfully.", customer: { _id: customer._id, status: customer.status } });
});

export const reactivateUser = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }
  if (customer.status === "active") {
    res.status(400); throw new Error("Customer is already active.");
  }

  customer.status = "active";
  customer.statusChangedAt = new Date();
  customer.statusChangedBy = req.user._id;
  await customer.save();

  await createAuditLog(req, "reactivate-customer", "Customer", customer._id, {
    previousStatus: customer.status,
    newStatus: "active",
  });

  res.json({ message: "Customer reactivated successfully.", customer: { _id: customer._id, status: customer.status } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  customer.deletedAt = new Date();
  customer.status = "banned";
  customer.statusChangedAt = new Date();
  customer.statusChangedBy = req.user._id;
  customer.refreshToken = null;
  customer.refreshTokenHistory = [];
  await customer.save();

  await createAuditLog(req, "delete-customer", "Customer", customer._id, {
    action: "soft-delete",
  });

  res.json({ message: "Customer account deleted successfully." });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  customer.password = newPassword;
  customer.refreshToken = null;
  customer.refreshTokenHistory = [];
  customer.loginAttempts = 0;
  customer.lockUntil = null;
  await customer.save();

  await createAuditLog(req, "reset-customer-password", "Customer", customer._id, {});

  res.json({ message: "Customer password reset successfully. All sessions have been invalidated." });
});

export const verifyUserEmail = asyncHandler(async (req, res) => {
  const { verified } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  customer.emailVerified = Boolean(verified);
  if (verified) {
    customer.emailVerifiedAt = customer.emailVerifiedAt || new Date();
  } else {
    customer.emailVerifiedAt = null;
  }
  await customer.save();

  await createAuditLog(req, "verify-customer-email", "Customer", customer._id, {
    verified: Boolean(verified),
  });

  res.json({ message: `Customer email ${verified ? "verified" : "unverified"} successfully.`, emailVerified: customer.emailVerified });
});

export const forceLogoutUser = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  customer.refreshToken = null;
  customer.refreshTokenHistory = [];
  await customer.save();

  await createAuditLog(req, "force-logout-customer", "Customer", customer._id, {});

  res.json({ message: "Customer logged out from all devices successfully." });
});

export const addAdminNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  customer.adminNotes.push({
    text,
    admin: req.user._id,
    adminName: req.user.name,
  });
  await customer.save();

  await createAuditLog(req, "add-customer-note", "Customer", customer._id, { note: text });

  const notes = customer.adminNotes;
  res.json({ message: "Note added successfully.", notes });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const [orders, total] = await Promise.all([
    Order.find({ "customer.email": customer.email })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments({ "customer.email": customer.email }),
  ]);

  res.json({ data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getUserLoginHistory = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const [history, total] = await Promise.all([
    LoginHistory.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LoginHistory.countDocuments({ customer: customer._id }),
  ]);

  res.json({ data: history, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const bulkSuspendUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400); throw new Error("No customer IDs provided.");
  }

  const result = await Customer.updateMany(
    { _id: { $in: ids }, deletedAt: null, status: { $ne: "suspended" } },
    { $set: { status: "suspended", statusChangedAt: new Date(), statusChangedBy: req.user._id } },
  );

  await createAuditLog(req, "bulk-suspend-customers", "Customer", null, { count: result.modifiedCount, ids });

  res.json({ message: `${result.modifiedCount} customer(s) suspended.`, modifiedCount: result.modifiedCount });
});

export const bulkActivateUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400); throw new Error("No customer IDs provided.");
  }

  const result = await Customer.updateMany(
    { _id: { $in: ids }, deletedAt: null, status: { $ne: "active" } },
    { $set: { status: "active", statusChangedAt: new Date(), statusChangedBy: req.user._id } },
  );

  await createAuditLog(req, "bulk-activate-customers", "Customer", null, { count: result.modifiedCount, ids });

  res.json({ message: `${result.modifiedCount} customer(s) activated.`, modifiedCount: result.modifiedCount });
});

export const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400); throw new Error("No customer IDs provided.");
  }

  const result = await Customer.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date(), status: "banned", statusChangedAt: new Date(), statusChangedBy: req.user._id, refreshToken: null } },
  );

  await createAuditLog(req, "bulk-delete-customers", "Customer", null, { count: result.modifiedCount, ids });

  res.json({ message: `${result.modifiedCount} customer(s) deleted.`, modifiedCount: result.modifiedCount });
});

export const exportUsers = asyncHandler(async (req, res) => {
  const status = req.query.status || "";
  const filter = { deletedAt: null };

  if (status && ["active", "suspended", "banned"].includes(status)) {
    filter.status = status;
  }

  const customers = await Customer.find(filter)
    .select("name email phone status emailVerified createdAt lastLoginAt loginAttempts")
    .sort({ createdAt: -1 })
    .lean();

  const emails = customers.map((c) => c.email);
  const orderCounts = await Order.aggregate([
    { $match: { "customer.email": { $in: emails } } },
    { $group: { _id: "$customer.email", count: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
  ]);

  const orderMap = {};
  orderCounts.forEach((o) => { orderMap[o._id] = { count: o.count, totalSpent: o.totalSpent }; });

  const csvHeader = "Name,Email,Phone,Status,Email Verified,Orders,Total Spent,Registered,Last Login\n";
  const csvRows = customers.map((c) => {
    const o = orderMap[c.email] || { count: 0, totalSpent: 0 };
    return [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ""}"`,
      c.status,
      c.emailVerified ? "Yes" : "No",
      o.count,
      o.totalSpent,
      c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
      c.lastLoginAt ? new Date(c.lastLoginAt).toISOString().split("T")[0] : "",
    ].join(",");
  }).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="customers-${Date.now()}.csv"`);
  res.send(csvHeader + csvRows);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    verifiedUsers,
    newUsers30d,
    newUsers7d,
    recentRegistrations,
  ] = await Promise.all([
    Customer.countDocuments({ deletedAt: null }),
    Customer.countDocuments({ deletedAt: null, status: "active" }),
    Customer.countDocuments({ deletedAt: null, status: "suspended" }),
    Customer.countDocuments({ deletedAt: null, status: "banned" }),
    Customer.countDocuments({ deletedAt: null, emailVerified: true }),
    Customer.countDocuments({ deletedAt: null, createdAt: { $gte: thirtyDaysAgo } }),
    Customer.countDocuments({ deletedAt: null, createdAt: { $gte: sevenDaysAgo } }),
    Customer.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(5).select("name email createdAt status").lean(),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    verifiedUsers,
    newUsers30d,
    newUsers7d,
    recentRegistrations,
  });
});
