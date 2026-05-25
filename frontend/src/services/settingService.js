import api from "./api.js";

export const getSetting = (key) => api.get(`/settings/${key}`).then((r) => r.data);
export const updateSetting = (key, value) => api.put(`/settings/${key}`, { value }).then((r) => r.data);
export const getAllSettings = () => api.get("/settings").then((r) => r.data);
