import * as svc from "./moderationService.js";
import { sendModerationEmail, sendAppealEmail, sendAppealResponseEmail } from "./moderationEmailService.js";
import Customer from "../models/Customer.js";
import ModerationCase from "./ModerationCase.js";

export const getMyStatus = async (req, res) => {
  const status = await svc.getAccountStatus(req.customer._id);
  const warnings = await svc.getActiveWarnings(req.customer._id);
  res.json({ ...status, warnings });
};

export const getMyHistory = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const result = await svc.getCustomerHistory(req.customer._id, { page, limit });
  res.json(result);
};

export const getMyAppealableCases = async (req, res) => {
  const cases = await svc.getAppealableCases(req.customer._id);
  res.json({ cases });
};

export const submitAppeal = async (req, res) => {
  const { caseId, message } = req.body;
  if (!caseId || !message?.trim()) {
    return res.status(400).json({ message: "Case ID and appeal message are required." });
  }

  const modCase = await svc.submitAppeal(caseId, req.customer._id, message.trim());

  try {
    await sendAppealEmail(modCase, req.customer.email, req.customer.name);
  } catch (err) {
    console.error("[MODERATION] Failed to send appeal email:", err?.message);
  }

  res.json({ message: "Appeal submitted successfully.", case: modCase });
};

export const getAdminCases = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const result = await svc.getAdminCases({
    page,
    limit,
    type: req.query.type,
    status: req.query.status,
    search: req.query.search,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  });
  res.json(result);
};

export const getAdminStats = async (req, res) => {
  const stats = await svc.getStats();
  res.json(stats);
};

export const warnUser = async (req, res) => {
  const { customerId, reason, evidence, notes } = req.body;
  if (!customerId || !reason?.trim()) {
    return res.status(400).json({ message: "Customer ID and reason are required." });
  }

  const customer = await Customer.findById(customerId).select("name email").lean();
  if (!customer || customer.deletedAt) {
    return res.status(404).json({ message: "Customer not found." });
  }

  const modCase = await svc.createModerationCase({
    customerId,
    type: "warning",
    reason: reason.trim(),
    issuedBy: req.user._id,
    issuedByName: req.user.name,
    evidence: evidence?.trim(),
    notes: notes?.trim(),
  });

  try {
    await sendModerationEmail(modCase, customer.email, customer.name);
  } catch {
    console.error("[MODERATION] Failed to send warning email");
  }

  res.status(201).json({ message: "Warning issued.", case: modCase });
};

export const suspendUser = async (req, res) => {
  const { customerId, reason, duration, evidence, notes } = req.body;
  if (!customerId || !reason?.trim()) {
    return res.status(400).json({ message: "Customer ID and reason are required." });
  }
  if (!duration || duration < 1) {
    return res.status(400).json({ message: "Duration is required (in hours)." });
  }

  const customer = await Customer.findById(customerId).select("name email").lean();
  if (!customer || customer.deletedAt) {
    return res.status(404).json({ message: "Customer not found." });
  }

  const modCase = await svc.createModerationCase({
    customerId,
    type: "suspension",
    reason: reason.trim(),
    duration: Number(duration),
    issuedBy: req.user._id,
    issuedByName: req.user.name,
    evidence: evidence?.trim(),
    notes: notes?.trim(),
  });

  try {
    await sendModerationEmail(modCase, customer.email, customer.name);
  } catch {
    console.error("[MODERATION] Failed to send suspension email");
  }

  res.status(201).json({ message: "Account suspended.", case: modCase });
};

export const banUser = async (req, res) => {
  const { customerId, reason, evidence, notes } = req.body;
  if (!customerId || !reason?.trim()) {
    return res.status(400).json({ message: "Customer ID and reason are required." });
  }

  const customer = await Customer.findById(customerId).select("name email").lean();
  if (!customer || customer.deletedAt) {
    return res.status(404).json({ message: "Customer not found." });
  }

  const modCase = await svc.createModerationCase({
    customerId,
    type: "ban",
    reason: reason.trim(),
    issuedBy: req.user._id,
    issuedByName: req.user.name,
    evidence: evidence?.trim(),
    notes: notes?.trim(),
  });

  try {
    await sendModerationEmail(modCase, customer.email, customer.name);
  } catch {
    console.error("[MODERATION] Failed to send ban email");
  }

  res.status(201).json({ message: "Account banned.", case: modCase });
};

export const liftModeration = async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) {
    return res.status(400).json({ message: "Customer ID is required." });
  }

  const result = await svc.liftModeration(customerId, req.user._id);
  res.json({ message: "Moderation lifted.", modifiedCount: result.modifiedCount });
};

export const resolveAppeal = async (req, res) => {
  const { caseId, response, action } = req.body;
  if (!caseId || !action || !response?.trim()) {
    return res.status(400).json({ message: "Case ID, response, and action (lift/reject) are required." });
  }
  if (!["lift", "reject"].includes(action)) {
    return res.status(400).json({ message: "Action must be 'lift' or 'reject'." });
  }

  const modCase = await svc.resolveAppeal(caseId, req.user._id, response.trim(), action);

  try {
    const customer = await Customer.findById(modCase.customerId).select("name email").lean();
    if (customer) {
      await sendAppealResponseEmail(modCase, customer.email, customer.name, action);
    }
  } catch {
    console.error("[MODERATION] Failed to send appeal response email");
  }

  res.json({ message: `Appeal ${action === "lift" ? "accepted" : "rejected"}.`, case: modCase });
};

export const getAdminCaseDetail = async (req, res) => {
  const modCase = await ModerationCase.findById(req.params.id)
    .populate("customerId", "name email")
    .populate("issuedBy", "name")
    .populate("resolvedBy", "name")
    .populate("appealResolvedBy", "name")
    .lean();

  if (!modCase) return res.status(404).json({ message: "Case not found." });

  res.json(modCase);
};

export const getCustomerStatus = async (req, res) => {
  const { customerId } = req.params;

  const status = await svc.getAccountStatus(customerId);
  const warnings = await svc.getActiveWarnings(customerId);
  const history = await svc.getCustomerHistory(customerId, { page: 1, limit: 50 });

  res.json({ ...status, warnings, history: history.cases });
};
