import AuditLog from "../models/AuditLog.js";
import PaymentMethod from "../models/PaymentMethod.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";

const CACHE_KEY = "payment_methods:all";

export const getEnabledPaymentMethods = asyncHandler(async (_req, res) => {
  const cached = cache.get(CACHE_KEY);
  if (cached) return res.json(cached);

  const methods = await PaymentMethod.find({ enabled: true }).sort({ sortOrder: 1, name: 1 }).lean();
  cache.set(CACHE_KEY, methods, 30 * 1000);
  res.json(methods);
});

export const getAllPaymentMethods = asyncHandler(async (_req, res) => {
  const methods = await PaymentMethod.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  res.json(methods);
});

export const getPaymentMethodById = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.id).lean();
  if (!method) {
    res.status(404);
    throw new Error("Payment method not found.");
  }
  res.json(method);
});

export const createPaymentMethod = asyncHandler(async (req, res) => {
  const { name, code, type, requiresSlipUpload, supportsPartialPayment, isOnlineGateway, sortOrder, config } = req.body;

  const existing = await PaymentMethod.findOne({ code: code?.toLowerCase().trim() });
  if (existing) {
    res.status(400);
    throw new Error("A payment method with this code already exists.");
  }

  const method = await PaymentMethod.create({
    name,
    code: code.toLowerCase().trim(),
    type: type || "custom",
    requiresSlipUpload: requiresSlipUpload || false,
    supportsPartialPayment: supportsPartialPayment || false,
    isOnlineGateway: isOnlineGateway || false,
    sortOrder: sortOrder || 0,
    config: config || {}
  });

  cache.clear(CACHE_KEY);

  await AuditLog.create({
    admin: req.user?._id,
    action: "payment_method_created",
    resource: "PaymentMethod",
    resourceId: method._id.toString(),
    details: { name: method.name, code: method.code },
    ip: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 255)
  });

  res.status(201).json(method);
});

export const updatePaymentMethod = asyncHandler(async (req, res) => {
  const { name, enabled, requiresSlipUpload, supportsPartialPayment, isOnlineGateway, sortOrder, config } = req.body;

  const method = await PaymentMethod.findById(req.params.id);
  if (!method) {
    res.status(404);
    throw new Error("Payment method not found.");
  }

  if (name !== undefined) method.name = name;
  if (enabled !== undefined) method.enabled = enabled;
  if (requiresSlipUpload !== undefined) method.requiresSlipUpload = requiresSlipUpload;
  if (supportsPartialPayment !== undefined) method.supportsPartialPayment = supportsPartialPayment;
  if (isOnlineGateway !== undefined) method.isOnlineGateway = isOnlineGateway;
  if (sortOrder !== undefined) method.sortOrder = sortOrder;
  if (config !== undefined) method.config = config;

  await method.save();

  cache.clear(CACHE_KEY);

  await AuditLog.create({
    admin: req.user?._id,
    action: enabled === false ? "payment_method_disabled" : enabled === true ? "payment_method_enabled" : "payment_method_updated",
    resource: "PaymentMethod",
    resourceId: method._id.toString(),
    details: { name: method.name, code: method.code, enabled: method.enabled },
    ip: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 255)
  });

  res.json(method);
});

export const deletePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findByIdAndDelete(req.params.id);
  if (!method) {
    res.status(404);
    throw new Error("Payment method not found.");
  }

  cache.clear(CACHE_KEY);

  await AuditLog.create({
    admin: req.user?._id,
    action: "payment_method_deleted",
    resource: "PaymentMethod",
    resourceId: req.params.id,
    details: { name: method.name, code: method.code },
    ip: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 255)
  });

  res.json({ message: "Payment method deleted." });
});

export const seedDefaultPaymentMethods = async () => {
  const count = await PaymentMethod.countDocuments();
  if (count > 0) return;

  await PaymentMethod.insertMany([
    { name: "Bank Transfer", code: "bank_transfer", type: "full_payment", enabled: true, requiresSlipUpload: true, supportsPartialPayment: false, isOnlineGateway: false, sortOrder: 1 },
    { name: "Cash on Delivery", code: "cod", type: "cod", enabled: true, requiresSlipUpload: false, supportsPartialPayment: false, isOnlineGateway: false, sortOrder: 2 },
    { name: "50% Advance Payment", code: "advance", type: "advance_50", enabled: true, requiresSlipUpload: true, supportsPartialPayment: true, isOnlineGateway: false, sortOrder: 3 }
  ]);
};
