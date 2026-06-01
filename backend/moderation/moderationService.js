import ModerationCase from "./ModerationCase.js";
import Customer from "../models/Customer.js";

export async function getAccountStatus(customerId) {
  const activeCase = await ModerationCase.findOne({
    customerId,
    status: "active",
    type: { $in: ["suspension", "ban"] },
  }).sort({ createdAt: -1 }).lean();

  if (!activeCase) return { status: "active", activeCase: null };

  if (activeCase.type === "ban") return { status: "banned", activeCase };
  if (activeCase.type === "suspension") return { status: "suspended", activeCase };

  return { status: "active", activeCase: null };
}

export async function getActiveWarnings(customerId) {
  return ModerationCase.find({
    customerId,
    status: "active",
    type: "warning",
  }).sort({ createdAt: -1 }).lean();
}

export async function createModerationCase({ customerId, type, reason, duration, issuedBy, issuedByName, evidence, notes }) {
  const caseData = {
    customerId,
    type,
    reason,
    issuedBy,
    issuedByName: issuedByName || "",
    evidence: evidence || "",
    notes: notes || "",
  };

  if (type === "suspension" && duration) {
    caseData.duration = duration;
    caseData.expiresAt = new Date(Date.now() + duration * 3600000);
  }

  const modCase = await ModerationCase.create(caseData);

  return modCase;
}

export async function liftModeration(customerId, resolvedBy) {
  const result = await ModerationCase.updateMany(
    { customerId, status: "active" },
    {
      $set: {
        status: "lifted",
        resolvedAt: new Date(),
        resolvedBy,
      },
    },
  );

  return result;
}

export async function expireSuspensions() {
  const result = await ModerationCase.updateMany(
    {
      status: "active",
      type: "suspension",
      expiresAt: { $lte: new Date(), $ne: null },
    },
    {
      $set: {
        status: "expired",
        resolvedAt: new Date(),
      },
    },
  );

  return result.modifiedCount;
}

export async function getCustomerHistory(customerId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const filter = { customerId };

  const [cases, total] = await Promise.all([
    ModerationCase.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ModerationCase.countDocuments(filter),
  ]);

  return {
    cases,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminCases({ page = 1, limit = 20, type, status, search, sortBy = "createdAt", sortOrder = "desc" } = {}) {
  const skip = (page - 1) * limit;
  const filter = {};

  if (type) filter.type = type;
  if (status) filter.status = status;

  if (search) {
    const customers = await Customer.find({
      deletedAt: null,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id").lean();

    filter.customerId = { $in: customers.map((c) => c._id) };
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [cases, total] = await Promise.all([
    ModerationCase.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    ModerationCase.countDocuments(filter),
  ]);

  return {
    cases,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getStats() {
  const [activeBans, activeSuspensions, activeWarnings, totalCases, pendingAppeals] = await Promise.all([
    ModerationCase.countDocuments({ status: "active", type: "ban" }),
    ModerationCase.countDocuments({ status: "active", type: "suspension" }),
    ModerationCase.countDocuments({ status: "active", type: "warning" }),
    ModerationCase.countDocuments({}),
    ModerationCase.countDocuments({ appealed: true, status: "appealed" }),
  ]);

  return {
    activeBans,
    activeSuspensions,
    activeWarnings,
    totalCases,
    pendingAppeals,
  };
}

export async function submitAppeal(caseId, customerId, message) {
  const modCase = await ModerationCase.findOne({ _id: caseId, customerId });

  if (!modCase) throw new Error("Case not found.");
  if (modCase.appealed) throw new Error("Appeal already submitted.");
  if (modCase.status !== "active") throw new Error("Cannot appeal a case that is no longer active.");

  modCase.appealed = true;
  modCase.appealMessage = message;
  modCase.appealDate = new Date();
  modCase.status = "appealed";
  await modCase.save();

  return modCase;
}

export async function resolveAppeal(caseId, adminId, response, action) {
  const modCase = await ModerationCase.findById(caseId);

  if (!modCase) throw new Error("Case not found.");
  if (!modCase.appealed) throw new Error("No appeal to resolve.");

  modCase.appealResponse = response;
  modCase.appealResolvedAt = new Date();
  modCase.appealResolvedBy = adminId;
  modCase.resolvedAt = new Date();
  modCase.resolvedBy = adminId;

  if (action === "lift") {
    modCase.status = "lifted";
  } else if (action === "reject") {
    modCase.status = "active";
  }

  await modCase.save();

  return modCase;
}

export async function getAppealableCases(customerId) {
  return ModerationCase.find({
    customerId,
    status: "active",
    appealed: false,
    type: { $in: ["suspension", "ban"] },
  }).sort({ createdAt: -1 }).lean();
}
