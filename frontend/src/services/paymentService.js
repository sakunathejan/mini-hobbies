import api from "./api.js";

export const submitBankTransfer = (formData) =>
  api.post("/payments/bank-transfer", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }).then((res) => res.data);

export const getPayments = () => api.get("/payments").then((res) => res.data);
export const getPaymentById = (id) => api.get(`/payments/${id}`).then((res) => res.data);
export const verifyPayment = (id) => api.patch(`/payments/${id}/verify`).then((res) => res.data);
export const rejectPayment = (id, reason) =>
  api.patch(`/payments/${id}/reject`, { reason }).then((res) => res.data);
export const deletePayment = (id) => api.delete(`/payments/${id}`).then((res) => res.data);
export const bulkDeletePayments = (ids) => api.post("/payments/bulk-delete", { ids }).then((res) => res.data);

export const submitBalancePayment = (formData) =>
  api.post("/payments/balance-payment", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }).then((res) => res.data);
