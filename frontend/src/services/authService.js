import api from "./api.js";

export const loginAdmin = (payload) => api.post("/auth/login", payload).then((res) => res.data);
export const refreshToken = () => api.post("/auth/refresh").then((res) => res.data);
export const logoutAdmin = () => api.post("/auth/logout").then((res) => res.data);
export const getDashboardStats = () => api.get("/auth/dashboard").then((res) => res.data);
export const updateAdminProfile = (payload) => api.put("/auth/profile", payload).then((res) => res.data);
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload).then((res) => res.data);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload).then((res) => res.data);
