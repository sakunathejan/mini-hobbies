import ModerationCase from "../models/ModerationCase.js";
import Customer from "../../models/Customer.js";
import AuditLog from "../../models/AuditLog.js";
import { sendMail } from "../../services/emailService.js";
import {
  warningIssued,
  suspensionApplied,
  suspensionExpired,
  banApplied,
  appealReceived,
  appealApproved,
  appealRejected,
  appealStatusUpdated,
  moderationLifted,
} from "../emails/emailTemplates.js";

async function trySendMail(to, subject, html) {
  try {
    await sendMail(to, subject, html);
    console.log(`[Moderation Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[Moderation Email] Failed to send to ${to}:`, err.message);
    return false;
  }
}

async function syncModerationStatus(customerId) {
  const active = await ModerationCase.findOne({
    customer: customerId,
    status: "active",
  }).sort({ createdAt: -1 }).lean();

  let status = "active";
  if (active) {
    if (active.type === "ban") status = "banned";
    else if (active.type === "suspension") status = "suspended";
    else if (active.type === "warning") status = "warned";
  }

  await Customer.findByIdAndUpdate(customerId, { $set: { moderationStatus: status } });
}

// --- Admin: Issue Warning ---
export async function issueWarning(customerId, data, admin) {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.deletedAt) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  const modCase = await ModerationCase.create({
    customer: customerId,
    moderator: admin._id,
    moderatorName: admin.name,
    type: "warning",
    reason: data.reason,
    message: data.message || "",
    severity: data.severity || "medium",
    status: "active",
    notes: data.notes || "",
    sendEmail: data.sendEmail !== false,
  });

  await AuditLog.create({
    admin: admin._id,
    action: "issue_warning",
    resource: "Customer",
    resourceId: String(customerId),
    details: { reason: data.reason, severity: data.severity, caseId: modCase._id },
  });

  if (data.sendEmail !== false) {
    const { subject, html } = warningIssued(customer.name, data);
    const sent = await trySendMail(customer.email, subject, html);
    modCase.emailSent = sent;
    await modCase.save();
  }

  await syncModerationStatus(customerId);
  return modCase;
}

// --- Admin: Apply Suspension ---
export async function applySuspension(customerId, data, admin) {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.deletedAt) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  const endAt = data.durationHours ? new Date(Date.now() + data.durationHours * 3600000) : data.endAt || null;

  const modCase = await ModerationCase.create({
    customer: customerId,
    moderator: admin._id,
    moderatorName: admin.name,
    type: "suspension",
    reason: data.reason,
    message: data.message || "",
    severity: data.severity || "medium",
    status: "active",
    startAt: new Date(),
    endAt,
    notes: data.notes || "",
    sendEmail: data.sendEmail !== false,
  });

  await AuditLog.create({
    admin: admin._id,
    action: "apply_suspension",
    resource: "Customer",
    resourceId: String(customerId),
    details: { reason: data.reason, severity: data.severity, endAt, caseId: modCase._id },
  });

  if (data.sendEmail !== false) {
    const { subject, html } = suspensionApplied(customer.name, { reason: data.reason, message: data.message, endAt });
    const sent = await trySendMail(customer.email, subject, html);
    modCase.emailSent = sent;
    await modCase.save();
  }

  await syncModerationStatus(customerId);
  return modCase;
}

// --- Admin: Apply Ban ---
export async function applyBan(customerId, data, admin) {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.deletedAt) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  const modCase = await ModerationCase.create({
    customer: customerId,
    moderator: admin._id,
    moderatorName: admin.name,
    type: "ban",
    reason: data.reason,
    message: data.message || "",
    severity: data.severity || "high",
    status: "active",
    notes: data.notes || "",
    sendEmail: data.sendEmail !== false,
  });

  await AuditLog.create({
    admin: admin._id,
    action: "apply_ban",
    resource: "Customer",
    resourceId: String(customerId),
    details: { reason: data.reason, severity: data.severity, caseId: modCase._id },
  });

  if (data.sendEmail !== false) {
    const { subject, html } = banApplied(customer.name, { reason: data.reason, message: data.message });
    const sent = await trySendMail(customer.email, subject, html);
    modCase.emailSent = sent;
    await modCase.save();
  }

  await syncModerationStatus(customerId);
  return modCase;
}

// --- Admin: Lift Moderation ---
export async function liftModeration(customerId, admin) {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.deletedAt) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  await ModerationCase.updateMany(
    { customer: customerId, status: "active" },
    { $set: { status: "lifted" } }
  );

  await AuditLog.create({
    admin: admin._id,
    action: "lift_moderation",
    resource: "Customer",
    resourceId: String(customerId),
  });

  await syncModerationStatus(customerId);
  const { subject, html } = moderationLifted(customer.name);
  const sent = await trySendMail(customer.email, subject, html);
  if (!sent) {
    console.log(`[Lift Moderation] Retrying email to ${customer.email}...`);
    await trySendMail(customer.email, subject, html);
  }
  return { lifted: true };
}

// --- Get Moderation History ---
export async function getModerationHistory(customerId) {
  const cases = await ModerationCase.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate("moderator", "name")
    .lean();
  const customer = await Customer.findById(customerId).select("moderationStatus").lean();
  return { cases, moderationStatus: customer?.moderationStatus || "active" };
}

// --- Get customer's current moderation status ---
export async function getCustomerModerationStatus(customerId) {
  const active = await ModerationCase.findOne({
    customer: customerId,
    status: "active",
  }).sort({ createdAt: -1 }).lean();

  if (!active) return { status: "active", case: null };

  if (active.type === "ban") {
    return { status: "banned", case: active };
  }
  if (active.type === "suspension") {
    if (active.endAt && new Date(active.endAt) <= new Date()) {
      await ModerationCase.findByIdAndUpdate(active._id, { $set: { status: "expired" } });
      await syncModerationStatus(customerId);
      const customer = await Customer.findById(customerId).select("name email");
      if (customer && !customer.deletedAt) {
        const { subject, html } = suspensionExpired(customer.name);
        await trySendMail(customer.email, subject, html);
      }
      return { status: "active", case: null };
    }
    return { status: "suspended", case: active };
  }
  return { status: "warned", case: active };
}

// --- Get All Cases (admin listing) ---
export async function listCases({ page = 1, limit = 20, type, status, appealStatus, search, startDate, endDate } = {}) {
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (appealStatus) filter.appealStatus = appealStatus;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  let total = await ModerationCase.countDocuments(filter);
  let data = await ModerationCase.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("customer", "name email createdAt")
    .populate("moderator", "name")
    .lean();

  if (search) {
    const q = search.toLowerCase();
    data = data.filter((c) =>
      (c.customer?.name?.toLowerCase().includes(q) ||
       c.customer?.email?.toLowerCase().includes(q) ||
       c.reason?.toLowerCase().includes(q) ||
       c.appealMessage?.toLowerCase().includes(q))
    );
    total = data.length;
  }

  return { data, total, page, pages: Math.ceil(total / limit) };
}

// --- Customer: Submit Appeal ---
export async function submitAppeal(customerId, message) {
  const active = await ModerationCase.findOne({
    customer: customerId,
    status: "active",
  }).sort({ createdAt: -1 });

  if (!active) {
    const err = new Error("No active moderation action to appeal");
    err.statusCode = 400;
    throw err;
  }
  if (active.appealStatus !== "none") {
    const err = new Error("An appeal has already been submitted for this action");
    err.statusCode = 400;
    throw err;
  }

  active.appealStatus = "pending";
  active.appealMessage = message;
  await active.save();

  const customer = await Customer.findById(customerId);
  const { subject, html } = appealReceived();
  await trySendMail(process.env.ADMIN_EMAIL || "admin@minihobbies.lk", subject, html);
  return active;
}

// --- Admin: Review Appeal ---
export async function reviewAppeal(caseId, decision, admin, reviewNotes) {
  const modCase = await ModerationCase.findById(caseId);
  if (!modCase) {
    const err = new Error("Moderation case not found");
    err.statusCode = 404;
    throw err;
  }
  if (modCase.appealStatus === "none") {
    const err = new Error("No appeal to review");
    err.statusCode = 400;
    throw err;
  }

  modCase.appealStatus = decision === "approve" ? "approved" : "rejected";
  modCase.appealReviewedBy = admin._id;
  modCase.appealReviewedAt = new Date();
  if (reviewNotes) modCase.appealReviewNotes = reviewNotes;

  if (decision === "approve") {
    await ModerationCase.updateMany(
      { customer: modCase.customer, status: "active" },
      { $set: { status: "lifted" } }
    );
    modCase.status = "lifted";
  }

  await modCase.save();

  const customer = await Customer.findById(modCase.customer);
  if (decision === "approve") {
    await syncModerationStatus(modCase.customer);
    const { subject, html } = appealApproved(customer.name);
    await trySendMail(customer.email, subject, html);
  } else {
    const { subject, html } = appealRejected(customer.name, reviewNotes);
    await trySendMail(customer.email, subject, html);
  }

  await AuditLog.create({
    admin: admin._id,
    action: decision === "approve" ? "approve_appeal" : "reject_appeal",
    resource: "ModerationCase",
    resourceId: String(caseId),
    details: { reviewNotes },
  });

  return modCase;
}

// --- Admin: Delete Appeal ---
export async function deleteAppeal(caseId) {
  const modCase = await ModerationCase.findById(caseId);
  if (!modCase) {
    const err = new Error("Moderation case not found");
    err.statusCode = 404;
    throw err;
  }
  if (modCase.appealStatus === "none") {
    const err = new Error("No appeal to delete");
    err.statusCode = 400;
    throw err;
  }

  modCase.appealStatus = "none";
  modCase.appealMessage = undefined;
  modCase.appealReviewedBy = undefined;
  modCase.appealReviewedAt = undefined;
  modCase.appealReviewNotes = undefined;
  await modCase.save();

  return modCase;
}

// --- Admin: Update Appeal Status (under_review, waiting_customer, escalated) ---
export async function updateAppealStatus(caseId, status, admin) {
  const modCase = await ModerationCase.findById(caseId).populate("customer", "name email");
  if (!modCase) {
    const err = new Error("Moderation case not found");
    err.statusCode = 404;
    throw err;
  }
  if (modCase.appealStatus === "none") {
    const err = new Error("No appeal to update");
    err.statusCode = 400;
    throw err;
  }

  modCase.appealStatus = status;
  if (status === "under_review" && !modCase.appealReviewedBy) {
    modCase.appealReviewedBy = admin._id;
    modCase.appealReviewedAt = new Date();
  }
  await modCase.save();

  const customer = modCase.customer;
  if (customer?.email) {
    const { subject, html } = appealStatusUpdated(customer.name, status);
    await trySendMail(customer.email, subject, html);
  }

  await AuditLog.create({
    admin: admin._id,
    action: "update_appeal_status",
    resource: "ModerationCase",
    resourceId: String(caseId),
    details: { status },
  });

  return modCase;
}

// --- Admin: Add Internal Note to Appeal ---
export async function addAppealNote(caseId, text, admin) {
  const modCase = await ModerationCase.findById(caseId);
  if (!modCase) {
    const err = new Error("Moderation case not found");
    err.statusCode = 404;
    throw err;
  }
  if (modCase.appealStatus === "none") {
    const err = new Error("No appeal to add notes to");
    err.statusCode = 400;
    throw err;
  }

  modCase.appealInternalNotes.push({ text, author: admin.name });
  await modCase.save();

  return modCase;
}

// --- Admin: Get Appeal Analytics ---
export async function getAppealAnalytics() {
  const total = await ModerationCase.countDocuments({ appealStatus: { $ne: "none" } });
  const pending = await ModerationCase.countDocuments({ appealStatus: "pending" });
  const underReview = await ModerationCase.countDocuments({ appealStatus: "under_review" });
  const approved = await ModerationCase.countDocuments({ appealStatus: "approved" });
  const rejected = await ModerationCase.countDocuments({ appealStatus: "rejected" });
  const activeBans = await ModerationCase.countDocuments({ type: "ban", status: "active" });

  const totalDecided = approved + rejected;
  const approvalRate = totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recentDecided = await ModerationCase.countDocuments({
    appealStatus: { $in: ["approved", "rejected"] },
    appealReviewedAt: { $gte: thirtyDaysAgo },
  });

  return { total, pending, underReview, approved, rejected, activeBans, approvalRate, recentDecided };
}

// --- Admin: Delete Any Moderation Case ---
export async function deleteModerationCase(caseId) {
  const modCase = await ModerationCase.findByIdAndDelete(caseId);
  if (!modCase) {
    const err = new Error("Moderation case not found");
    err.statusCode = 404;
    throw err;
  }

  if (modCase.customer) {
    await syncModerationStatus(modCase.customer);
  }

  await AuditLog.create({
    admin: null,
    action: "delete_moderation_case",
    resource: "ModerationCase",
    resourceId: String(caseId),
    details: { deletedCase: modCase.toObject() },
  });

  return { deleted: true };
}

// --- Expire expired suspensions ---
export async function expireSuspensions() {
  const expired = await ModerationCase.find({
    type: "suspension",
    status: "active",
    endAt: { $lte: new Date() },
  });

  for (const modCase of expired) {
    modCase.status = "expired";
    await modCase.save();
    await syncModerationStatus(modCase.customer);
    const customer = await Customer.findById(modCase.customer);
    if (customer && !customer.deletedAt) {
      const { subject, html } = suspensionExpired(customer.name);
      await trySendMail(customer.email, subject, html);
    }
  }
  return expired.length;
}
