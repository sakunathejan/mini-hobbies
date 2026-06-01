import AuditLog from "../models/AuditLog.js";

export async function logAudit({ action, orderId, orderNumber, user, details, ip }) {
  try {
    await AuditLog.create({
      action,
      order: orderId,
      orderNumber: orderNumber || "",
      user: user || "system",
      details: details || {},
      ip: ip || "",
      timestamp: new Date()
    });
  } catch (err) {
    console.error(`[Audit] Failed to log ${action}:`, err.message);
  }
}

export async function getAuditLogs({ action, orderId, limit = 50, skip = 0 } = {}) {
  const filter = {};
  if (action) filter.action = action;
  if (orderId) filter.order = orderId;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter)
  ]);
  return { logs, total };
}
