import api from "./api.js";

export const getEnabledPaymentMethods = () =>
  api.get("/payment-methods/enabled").then((r) => r.data);

export const getAllPaymentMethods = () =>
  api.get("/payment-methods").then((r) => r.data);

export const getPaymentMethodById = (id) =>
  api.get(`/payment-methods/${id}`).then((r) => r.data);

export const createPaymentMethod = (data) =>
  api.post("/payment-methods", data).then((r) => r.data);

export const updatePaymentMethod = (id, data) =>
  api.patch(`/payment-methods/${id}`, data).then((r) => r.data);

export const deletePaymentMethod = (id) =>
  api.delete(`/payment-methods/${id}`).then((r) => r.data);
