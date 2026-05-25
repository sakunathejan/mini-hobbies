import api from "./api.js";

export const loginAdmin = (payload) => api.post("/auth/login", payload).then((res) => res.data);
export const getDashboardStats = () => api.get("/auth/dashboard").then((res) => res.data);
