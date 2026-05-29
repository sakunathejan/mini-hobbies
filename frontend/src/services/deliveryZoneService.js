import api from "./api.js";

export const getDeliveryZones = (params) => api.get("/delivery-zones", { params }).then((res) => res.data);
export const createDeliveryZone = (payload) => api.post("/delivery-zones", payload).then((res) => res.data);
export const updateDeliveryZone = (id, payload) => api.put(`/delivery-zones/${id}`, payload).then((res) => res.data);
export const deleteDeliveryZone = (id) => api.delete(`/delivery-zones/${id}`).then((res) => res.data);
export const seedDeliveryZones = () => api.post("/delivery-zones/seed").then((res) => res.data);
export const importCSV = (file, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/delivery-zones/import", fd, {
    timeout: 60000,
    onUploadProgress: onProgress
  }).then((res) => res.data);
};
export const getImportHistory = () => api.get("/delivery-zones/import-history").then((res) => res.data);
export const toggleZoneActive = (id) => api.patch(`/delivery-zones/${id}/toggle`).then((res) => res.data);
export const getZoneStats = () => api.get("/delivery-zones/stats").then((res) => res.data);
export const bulkDeleteZones = (ids) => api.post("/delivery-zones/bulk-delete", { ids }).then((res) => res.data);
