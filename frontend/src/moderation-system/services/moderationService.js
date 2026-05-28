import api from "../../services/api.js";
import customerApi from "../../services/customerApi.js";

const BASE = "/admin/moderation";
const CUSTOMER_BASE = "/customers/moderation";

export const warnUser = (customerId, data) => api.post(`${BASE}/${customerId}/warn`, data).then((r) => r.data);
export const suspendUser = (customerId, data) => api.post(`${BASE}/${customerId}/suspend`, data).then((r) => r.data);
export const banUser = (customerId, data) => api.post(`${BASE}/${customerId}/ban`, data).then((r) => r.data);
export const liftModeration = (customerId) => api.post(`${BASE}/${customerId}/lift`).then((r) => r.data);
export const getModerationHistory = (customerId) => api.get(`${BASE}/cases/${customerId}`).then((r) => r.data);
export const getAllCases = (params) => api.get(`${BASE}/cases`, { params }).then((r) => r.data);
export const approveAppeal = (caseId, notes) => api.post(`${BASE}/appeals/${caseId}/approve`, { notes }).then((r) => r.data);
export const rejectAppeal = (caseId, notes) => api.post(`${BASE}/appeals/${caseId}/reject`, { notes }).then((r) => r.data);
export const deleteAppeal = (caseId) => api.delete(`${BASE}/appeals/${caseId}`).then((r) => r.data);
export const deleteCase = (caseId) => api.delete(`${BASE}/${caseId}`).then((r) => r.data);
export const updateAppealStatus = (caseId, status) => api.patch(`${BASE}/appeals/${caseId}/status`, { status }).then((r) => r.data);
export const addAppealNote = (caseId, text) => api.post(`${BASE}/appeals/${caseId}/notes`, { text }).then((r) => r.data);
export const getAppealStats = () => api.get(`${BASE}/appeals/stats`).then((r) => r.data);

export const getMyModerationStatus = () => customerApi.get(`${CUSTOMER_BASE}/status`).then((r) => r.data);
export const getMyModerationHistory = () => customerApi.get(`${CUSTOMER_BASE}/history`).then((r) => r.data);
export const submitAppeal = (message) => customerApi.post(`${CUSTOMER_BASE}/appeal`, { message }).then((r) => r.data);
