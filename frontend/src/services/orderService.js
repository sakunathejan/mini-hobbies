import api from "./api.js";

export const createOrder = (payload) => {
  const isFormData = payload instanceof FormData;
  return api.post("/orders", payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
  }).then((res) => res.data);
};
export const getOrders = () => api.get("/orders").then((res) => res.data);
export const getOrderById = (id) => api.get(`/orders/${id}`).then((res) => res.data);
export const updateOrderStatus = (id, payload) =>
  api.patch(`/orders/${id}/status`, payload).then((res) => res.data);
export const trackOrder = (orderNumber, phone) =>
  api.get(`/orders/track/${orderNumber}`, { params: { phone } }).then((res) => res.data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`).then((res) => res.data);
export const retryWhatsApp = (id) => api.post(`/orders/${id}/retry-whatsapp`).then((res) => res.data);
