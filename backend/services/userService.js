import Customer from "../models/Customer.js";
import AuditLog from "../models/AuditLog.js";
import LoginHistory from "../models/LoginHistory.js";
import Order from "../models/Order.js";

export const DEFAULT_PAGE_SIZE = 20;

export function buildUserFilter({ search, status, verified }) {
  const filter = { deletedAt: null };
  if (status) filter.moderationStatus = status;
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
  return filter;
}

export function buildSortOption(sortBy, sortOrder) {
  const order = sortOrder === "asc" ? 1 : -1;
  const allowed = {
    createdAt: "createdAt",
    name: "name",
    email: "email",
    lastLoginAt: "lastLoginAt",
    loginAttempts: "loginAttempts",
    moderationStatus: "moderationStatus",

  };
  return { [allowed[sortBy] || "createdAt"]: order };
}

export async function listUsers({ filter, sort, page, limit }) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) };
}

export async function getUserById(id) {
  const customer = await Customer.findById(id).lean();
  if (!customer || customer.deletedAt) return null;
  const [totalOrders, totalSpent, loginHistory] = await Promise.all([
    Order.countDocuments({ customer: id }),
    Order.aggregate([
      { $match: { customer: id, status: { $in: ["delivered", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    LoginHistory.find({ customer: id }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  return {
    ...customer,
    stats: {
      totalOrders,
      totalSpent: totalSpent[0]?.total || 0,
    },
    loginHistory,
  };
}

export async function updateUserFields(id, fields) {
  const customer = await Customer.findById(id);
  if (!customer || customer.deletedAt) return null;
  const allowed = ["name", "phone", "email", "avatar", "preferences"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      if (key === "email") fields[key] = fields[key].toLowerCase().trim();
      customer[key] = fields[key];
    }
  }
  await customer.save();
  return customer.toPublicProfile();
}

export async function softDeleteUser(id, adminId) {
  const customer = await Customer.findById(id);
  if (!customer || customer.deletedAt) return null;
  customer.deletedAt = new Date();
  customer.email = `deleted_${customer._id}_${Date.now()}@minihobbies.lk`;
  customer.refreshToken = null;
  await customer.save();
  await AuditLog.create({
    admin: adminId,
    action: "delete_user",
    resource: "Customer",
    resourceId: String(customer._id),
    details: { email: customer.email },
  });
  return { id: customer._id, deleted: true };
}

export async function resetUserPassword(id, newPassword) {
  const customer = await Customer.findById(id);
  if (!customer || customer.deletedAt) return null;
  customer.password = newPassword;
  customer.refreshToken = null;
  await customer.save();
  return { id: customer._id, passwordReset: true };
}

export async function forceLogout(id) {
  const customer = await Customer.findById(id);
  if (!customer || customer.deletedAt) return null;
  customer.refreshToken = null;
  await customer.save();
  return { id: customer._id, loggedOut: true };
}

export async function getUserOrders(id, { page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Order.find({ customer: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ customer: id }),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) };
}

export async function getUserLoginHistory(id, { page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    LoginHistory.find({ customer: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LoginHistory.countDocuments({ customer: id }),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) };
}

export async function getUserStats() {
  const [totalUsers, warnedUsers, suspendedUsers, bannedUsers, verifiedUsers, last30] = await Promise.all([
    Customer.countDocuments({ deletedAt: null }),
    Customer.countDocuments({ deletedAt: null, moderationStatus: "warned" }),
    Customer.countDocuments({ deletedAt: null, moderationStatus: "suspended" }),
    Customer.countDocuments({ deletedAt: null, moderationStatus: "banned" }),
    Customer.countDocuments({ deletedAt: null, emailVerified: true }),
    Customer.countDocuments({ deletedAt: null, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
  ]);
  const activeUsers = totalUsers - warnedUsers - suspendedUsers - bannedUsers;
  return { totalUsers, activeUsers, warnedUsers, suspendedUsers, bannedUsers, verifiedUsers, newUsersLast30Days: last30 };
}

export async function exportUsersCSV({ filter, sort }) {
  const customers = await Customer.find(filter).sort(sort).lean();
  return customers;
}

export async function bulkAction(ids, actionFn) {
  const results = { succeeded: [], failed: [] };
  for (const id of ids) {
    try {
      const result = await actionFn(id);
      if (result) results.succeeded.push(id);
      else results.failed.push(id);
    } catch {
      results.failed.push(id);
    }
  }
  return results;
}
