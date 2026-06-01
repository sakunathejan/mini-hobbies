import api from "../services/api.js";

export async function getMyModerationStatus() {
  const { data } = await api.get("/moderation/my-status");
  return data;
}

export async function getMyHistory({ page = 1, limit = 20 } = {}) {
  const { data } = await api.get("/moderation/my-history", { params: { page, limit } });
  return data;
}

export async function getMyAppealableCases() {
  const { data } = await api.get("/moderation/my-appealable");
  return data;
}

export async function submitAppeal(caseId, message) {
  const { data } = await api.post("/moderation/appeal", { caseId, message });
  return data;
}

export async function getAdminCases(params) {
  const { data } = await api.get("/moderation/admin/cases", { params });
  return data;
}

export async function getAdminStats() {
  const { data } = await api.get("/moderation/admin/stats");
  return data;
}

export async function getAdminCaseDetail(id) {
  const { data } = await api.get(`/moderation/admin/cases/${id}`);
  return data;
}

export async function warnUser(customerId, reason, evidence, notes) {
  const { data } = await api.post("/moderation/admin/warn", { customerId, reason, evidence, notes });
  return data;
}

export async function suspendUser(customerId, reason, duration, evidence, notes) {
  const { data } = await api.post("/moderation/admin/suspend", { customerId, reason, duration, evidence, notes });
  return data;
}

export async function banUser(customerId, reason, evidence, notes) {
  const { data } = await api.post("/moderation/admin/ban", { customerId, reason, evidence, notes });
  return data;
}

export async function liftModeration(customerId) {
  const { data } = await api.post("/moderation/admin/lift", { customerId });
  return data;
}

export async function resolveAppeal(caseId, response, action) {
  const { data } = await api.post("/moderation/admin/resolve-appeal", { caseId, response, action });
  return data;
}

export async function getCustomerModerationStatus(customerId) {
  const { data } = await api.get(`/moderation/admin/customer-status/${customerId}`);
  return data;
}
