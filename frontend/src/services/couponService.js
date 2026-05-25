import api from "./api.js";

export const validateCoupon = (code, subtotal) =>
  api.post("/coupons/validate", { code, subtotal }).then((res) => res.data);
export const getCoupons = () => api.get("/coupons").then((res) => res.data);
export const createCoupon = (payload) => api.post("/coupons", payload).then((res) => res.data);
export const updateCoupon = (id, payload) => api.put(`/coupons/${id}`, payload).then((res) => res.data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then((res) => res.data);
