import api from "./api.js";

export const getChatDashboard = () => api.get("/admin/chat/dashboard").then((r) => r.data);

export const getConversations = (params = {}) => api.get("/admin/chat/conversations", { params }).then((r) => r.data);

export const getConversationDetail = (sessionId) => api.get(`/admin/chat/conversations/${sessionId}`).then((r) => r.data);

export const resolveConversation = (sessionId) => api.patch(`/admin/chat/conversations/${sessionId}/resolve`).then((r) => r.data);

export const flagMessage = (sessionId, messageId, reason) =>
  api.patch(`/admin/chat/conversations/${sessionId}/messages/${messageId}/flag`, { reason }).then((r) => r.data);

export const getChatAnalytics = (params = {}) => api.get("/admin/chat/analytics", { params }).then((r) => r.data);

export const exportConversations = (params = {}) =>
  api.get("/admin/chat/export", { params, responseType: params.format === "csv" ? "blob" : "json" }).then((r) => r.data);

export const getKnowledgeBase = (params = {}) => api.get("/admin/chat/knowledge", { params }).then((r) => r.data);

export const getKnowledgeEntry = (id) => api.get(`/admin/chat/knowledge/${id}`).then((r) => r.data);

export const createKnowledgeEntry = (data) => api.post("/admin/chat/knowledge", data).then((r) => r.data);

export const updateKnowledgeEntry = (id, data) => api.put(`/admin/chat/knowledge/${id}`, data).then((r) => r.data);

export const deleteKnowledgeEntry = (id) => api.delete(`/admin/chat/knowledge/${id}`).then((r) => r.data);

export const importKnowledge = (entries) => api.post("/admin/chat/knowledge/import", { entries }).then((r) => r.data);

export const testKnowledgeMatch = (question) => api.post("/admin/chat/knowledge/test", { question }).then((r) => r.data);

export const getChatConfig = () => api.get("/admin/chat/config").then((r) => r.data);

export const updateChatConfig = (key, value) => api.put("/admin/chat/config", { key, value }).then((r) => r.data);

export const updateChatConfigBulk = (updates) => api.patch("/admin/chat/config", { updates }).then((r) => r.data);

export const resetChatConfigKey = (key) => api.delete(`/admin/chat/config/${key}`).then((r) => r.data);

export const testChatResponse = (message, includeKnowledge = true) =>
  api.post("/admin/chat/test", { message, includeKnowledge }).then((r) => r.data);

export const getUnansweredQueries = (params = {}) => api.get("/admin/chat/unanswered", { params }).then((r) => r.data);

export const resolveUnansweredQuery = (id, resolution) =>
  api.post(`/admin/chat/unanswered/${id}/resolve`, resolution).then((r) => r.data);
