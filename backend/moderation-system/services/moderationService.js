import ModerationCase from "../models/ModerationCase.js";
import Customer from "../../models/Customer.js";
import AuditLog from "../../models/AuditLog.js";
import { queueWarningEmail, queueSuspensionEmail, queueSuspensionExpiredEmail, queueBanEmail, queueModerationLiftedEmail, queueAppealReceivedEmail, queueAppealApprovedEmail, queueAppealRejectedEmail, queueAppealStatusUpdatedEmail } from "./emailService.js";

function log(level, event, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  const msg = `[Moderation ${event}] ${JSON.stringify(entry)}`;
  if (level === "ERROR") console.error(msg);
  else console.log(msg);
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

async function queueModerationEmail(type, customer, modCase, data = {}) {
  if (!customer?.email) {
    log("ERROR", "email_skipped", { reason: "no_email", userId: customer?._id, moderationId: String(modCase._id) });
    return false;
  }

  try {
    const emailData = { reason: data.reason, message: data.message, endAt: data.endAt, severity: data.severity };
    let queueFn;
    if (type === "warning") queueFn = () => queueWarningEmail(customer, emailData);
    else if (type === "suspension") queueFn = () => queueSuspensionEmail(customer, emailData);
    else if (type === "ban") queueFn = () => queueBanEmail(customer, emailData);
    else if (type === "lifted") queueFn = () => queueModerationLiftedEmail(customer);
    else if (type === "suspension_expired") queueFn = () => queueSuspensionExpiredEmail(customer);
    else if (type === "appeal_received") queueFn = () => queueAppealReceivedEmail();
    else if (type === "appeal_approved") queueFn = () => queueAppealApprovedEmail(customer);
    else if (type === "appeal_rejected") queueFn = () => queueAppealRejectedEmail(customer, data.reviewNotes);
    else if (type === "appeal_status_updated") queueFn = () => queueAppealStatusUpdatedEmail(customer, data.appealStatus);
    else return false;

    await queueFn();
    log("INFO", "email_queued", { userId: String(customer._id), email: customer.email, moderationId: String(modCase._id), type });
    return true;
  } catch (err) {
    log("ERROR", "email_queued_failed", { userId: String(customer._id), email: customer.email, moderationId: String(modCase._id), type, error: err.message });
    return false;
  }
}

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

  log("INFO", "moderation_created", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "warning", reason: data.reason });

  if (data.sendEmail !== false) {
    const sent = await queueModerationEmail("warning", customer, modCase, data);
    modCase.emailSent = sent;
    await modCase.save();
    if (sent) {
      log("INFO", "email_sent", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "warning" });
    } else {
      log("ERROR", "email_failed", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "warning" });
    }
  }

  await syncModerationStatus(customerId);
  return modCase;
}

export async function applySuspension(customerId, data, admin) {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.deletedAt) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  let endAt = null;
  if (data.durationHours) {
    endAt = new Date(Date.now() + data.durationHours * 3600000);
  } else if (data.endAt) {
    endAt = new Date(data.endAt);
  }

  if (!endAt || isNaN(endAt.getTime())) {
    const err = new Error("Suspension requires either durationHours or endAt");
    err.statusCode = 400;
    throw err;
  }

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

  log("INFO", "suspension_created", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), endAt: endAt?.toISOString(), reason: data.reason });

  if (data.sendEmail !== false) {
    const sent = await queueModerationEmail("suspension", customer, modCase, { ...data, endAt });
    modCase.emailSent = sent;
    await modCase.save();
    if (sent) {
      log("INFO", "email_sent", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "suspension" });
    } else {
      log("ERROR", "email_failed", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "suspension" });
    }
  }

  await syncModerationStatus(customerId);
  return modCase;
}

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

  log("INFO", "ban_created", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), reason: data.reason });

  if (data.sendEmail !== false) {
    const sent = await queueModerationEmail("ban", customer, modCase, data);
    modCase.emailSent = sent;
    await modCase.save();
    if (sent) {
      log("INFO", "email_sent", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "ban" });
    } else {
      log("ERROR", "email_failed", { userId: String(customerId), email: customer.email, moderationId: String(modCase._id), type: "ban" });
    }
  }

  await syncModerationStatus(customerId);
  return modCase;
}

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

  log("INFO", "moderation_lifted", { userId: String(customerId), email: customer.email });

  await syncModerationStatus(customerId);

  const sent = await queueModerationEmail("lifted", customer, { _id: "manual_lift" }, {});
  log("INFO", "email_sent", { userId: String(customerId), email: customer.email, type: "lifted", sent });

  return { lifted: true };
}

export async function getModerationHistory(customerId) {
  const cases = await ModerationCase.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate("moderator", "name")
    .lean();
  const customer = await Customer.findById(customerId).select("moderationStatus").lean();
  return { cases, moderationStatus: customer?.moderationStatus || "active" };
}

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
      return { status: "active", case: null };
    }
    return { status: "suspended", case: active };
  }
  return { status: "warned", case: active };
}

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

  log("INFO", "appeal_submitted", { userId: String(customerId), moderationId: String(active._id) });

  const customer = await Customer.findById(customerId);
  await queueModerationEmail("appeal_received", customer, active, {});
  return active;
}

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
  if (!customer) return modCase;

  if (decision === "approve") {
    await syncModerationStatus(modCase.customer);
    await queueModerationEmail("appeal_approved", customer, modCase, {});
    log("INFO", "appeal_approved", { userId: String(modCase.customer), moderationId: String(caseId) });
  } else {
    await queueModerationEmail("appeal_rejected", customer, modCase, { reviewNotes });
    log("INFO", "appeal_rejected", { userId: String(modCase.customer), moderationId: String(caseId) });
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

  log("INFO", "appeal_deleted", { moderationId: String(caseId) });

  return modCase;
}

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
    await queueModerationEmail("appeal_status_updated", customer, modCase, { appealStatus: status });
    log("INFO", "appeal_status_updated", { userId: String(customer._id), moderationId: String(caseId), status });
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

  log("INFO", "moderation_case_deleted", { moderationId: String(caseId) });

  return { deleted: true };
}

export async function expireSuspensions() {
  const now = new Date();
  log("INFO", "expiry_check_start", { checkedAt: now.toISOString() });

  const expired = await ModerationCase.find({
    type: "suspension",
    status: "active",
    endAt: { $lte: now },
  });

  log("INFO", "expiry_found_count", { count: expired.length });

  let count = 0;
  for (const modCase of expired) {
    try {
      const endAtStr = modCase.endAt?.toISOString?.() ?? String(modCase.endAt);
      log("INFO", "expiry_processing", { moderationId: String(modCase._id), customerId: String(modCase.customer), endAt: endAtStr });

      modCase.status = "expired";
      await modCase.save();
      log("INFO", "expiry_marked_expired", { moderationId: String(modCase._id) });

      await syncModerationStatus(modCase.customer);
      log("INFO", "expiry_user_reactivated", { customerId: String(modCase.customer) });

      const customer = await Customer.findById(modCase.customer);
      if (!customer) {
        log("ERROR", "expiry_customer_not_found", { customerId: String(modCase.customer) });
        count++;
        continue;
      }
      if (customer.deletedAt) {
        log("WARN", "expiry_customer_deleted", { customerId: String(customer._id), deletedAt: customer.deletedAt });
        count++;
        continue;
      }
      if (!customer.email) {
        log("ERROR", "expiry_no_email", { customerId: String(customer._id) });
        count++;
        continue;
      }

      log("INFO", "expiry_email_queuing", { customerId: String(customer._id), email: customer.email });
      const sent = await queueModerationEmail("suspension_expired", customer, modCase, {});
      modCase.emailSent = sent;
      await modCase.save();

      if (sent) {
        log("INFO", "expiry_email_sent", { customerId: String(customer._id), email: customer.email, moderationId: String(modCase._id) });
      } else {
        log("ERROR", "expiry_email_failed", { customerId: String(customer._id), email: customer.email, moderationId: String(modCase._id) });
      }
      count++;
    } catch (err) {
      log("ERROR", "expiry_case_error", { moderationId: String(modCase._id), customerId: String(modCase.customer), error: err.message });
      count++;
    }
  }

  if (count > 0) {
    log("INFO", "expiry_batch_complete", { count });
  }

  return count;
}
