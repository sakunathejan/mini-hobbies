import asyncHandler from "../utils/asyncHandler.js";
import * as userService from "../services/userService.js";
import AuditLog from "../models/AuditLog.js";
import Customer from "../models/Customer.js";

const audit = (req, action, resource, resourceId, details = {}) =>
  AuditLog.create({
    admin: req.user._id,
    action,
    resource,
    resourceId: resourceId ? String(resourceId) : undefined,
    details,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || userService.DEFAULT_PAGE_SIZE));
  const filter = userService.buildUserFilter({
    search: req.query.search,
    status: req.query.status,
    verified: req.query.verified,
  });
  const sort = userService.buildSortOption(req.query.sortBy, req.query.sortOrder);
  const result = await userService.listUsers({ filter, sort, page, limit });

  const customerIds = result.data.map((c) => c._id);
  const { default: Order } = await import("../models/Order.js");
  const [orderStats] = await Promise.all([
    Order.aggregate([
      { $match: { customerId: { $in: customerIds } } },
      { $group: { _id: "$customerId", count: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
    ]),
  ]);

  const statsMap = Object.fromEntries(orderStats.map((o) => [o._id.toString(), { count: o.count, totalSpent: o.totalSpent }]));

  const data = result.data.map((c) => ({
    ...c,
    orderCount: statsMap[c._id.toString()]?.count || 0,
    totalSpent: statsMap[c._id.toString()]?.totalSpent || 0,
  }));

  res.json({ data, pagination: { page, limit, total: result.total, pages: result.pages } });
});

export const getUserById = asyncHandler(async (req, res) => {
  const customer = await userService.getUserById(req.params.id);
  if (!customer) {
    res.status(404); throw new Error("Customer not found.");
  }
  const { default: Order } = await import("../models/Order.js");
  const recentOrders = await Order.find({ customerId: req.params.id })
    .sort({ createdAt: -1 }).limit(10).populate("payment", "status method").lean();
  res.json({ ...customer, recentOrders });
});

export const updateUser = asyncHandler(async (req, res) => {
  const customer = await userService.updateUserFields(req.params.id, req.body);
  if (!customer) {
    res.status(404); throw new Error("Customer not found.");
  }
  await audit(req, "update-customer", "Customer", req.params.id, { changes: req.body });
  res.json(customer);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.softDeleteUser(req.params.id, req.user._id);
  if (!result) {
    res.status(404); throw new Error("Customer not found.");
  }
  res.json({ message: "Customer account deleted successfully." });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const result = await userService.resetUserPassword(req.params.id, req.body.newPassword);
  if (!result) {
    res.status(404); throw new Error("Customer not found.");
  }
  await audit(req, "reset-customer-password", "Customer", req.params.id);
  res.json({ message: "Customer password reset successfully. All sessions invalidated." });
});

export const verifyUserEmail = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }
  customer.emailVerified = req.body.verified;
  await customer.save();
  await audit(req, "verify-customer-email", "Customer", req.params.id, { verified: req.body.verified });
  res.json({
    message: `Customer email ${req.body.verified ? "verified" : "unverified"} successfully.`,
    emailVerified: customer.emailVerified,
  });
});

export const forceLogoutUser = asyncHandler(async (req, res) => {
  const result = await userService.forceLogout(req.params.id);
  if (!result) {
    res.status(404); throw new Error("Customer not found.");
  }
  await audit(req, "force-logout-customer", "Customer", req.params.id);
  res.json({ message: "Customer logged out from all devices successfully." });
});

export const addAdminNote = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.deletedAt) {
    res.status(404); throw new Error("Customer not found.");
  }
  customer.adminNotes.push({
    text: req.body.text,
    admin: req.user._id,
    adminName: req.user.name,
  });
  await customer.save();
  await audit(req, "add-customer-note", "Customer", req.params.id);
  res.json({ message: "Note added successfully.", notes: customer.adminNotes });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const result = await userService.getUserOrders(req.params.id, { page, limit });
  if (!result) {
    res.status(404); throw new Error("Customer not found.");
  }
  res.json({ data: result.data, pagination: { page, limit, total: result.total, pages: result.pages } });
});

export const getUserLoginHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const result = await userService.getUserLoginHistory(req.params.id, { page, limit });
  if (!result) {
    res.status(404); throw new Error("Customer not found.");
  }
  res.json({ data: result.data, pagination: { page, limit, total: result.total, pages: result.pages } });
});

export const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400); throw new Error("No customer IDs provided.");
  }
  const result = await userService.bulkAction(ids, (id) => userService.softDeleteUser(id, req.user._id));
  await audit(req, "bulk-delete-customers", "Customer", null, result);
  res.json({ message: `${result.succeeded.length} customer(s) deleted.`, ...result });
});

export const exportUsers = asyncHandler(async (req, res) => {
  const filter = userService.buildUserFilter({ status: req.query.status });
  const sort = userService.buildSortOption("createdAt", "desc");
  const customers = await userService.exportUsersCSV({ filter, sort });

  const customerIds = customers.map((c) => c._id);
  const { default: Order } = await import("../models/Order.js");
  const orderStats = await Order.aggregate([
    { $match: { customerId: { $in: customerIds } } },
    { $group: { _id: "$customerId", count: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
  ]);
  const orderMap = Object.fromEntries(orderStats.map((o) => [o._id.toString(), { count: o.count, totalSpent: o.totalSpent }]));

  const csvHeader = "Name,Email,Phone,Email Verified,Orders,Total Spent,Registered,Last Login\n";
  const csvRows = customers.map((c) => {
    const o = orderMap[c._id.toString()] || { count: 0, totalSpent: 0 };
    return [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ""}"`,
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
  const stats = await userService.getUserStats();
  const recentRegistrations = await Customer.find({ deletedAt: null })
    .sort({ createdAt: -1 }).limit(5).select("name email createdAt").lean();
  res.json({ ...stats, recentRegistrations });
});
