import api from "./api.js";

export const getDeliveryZones = () => api.get("/delivery-zones").then((res) => res.data);
export const createDeliveryZone = (payload) => api.post("/delivery-zones", payload).then((res) => res.data);
export const updateDeliveryZone = (id, payload) => api.put(`/delivery-zones/${id}`, payload).then((res) => res.data);
export const deleteDeliveryZone = (id) => api.delete(`/delivery-zones/${id}`).then((res) => res.data);
export const seedDeliveryZones = () => api.post("/delivery-zones/seed").then((res) => res.data);
export const bulkUpdateZones = (data) => api.post("/delivery-zones/bulk-update", data).then((res) => res.data);
