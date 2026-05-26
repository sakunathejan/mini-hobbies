import api from "./api.js";

const toFormData = (payload) => {
  if (!(payload.image instanceof File)) {
    const copy = { ...payload };
    delete copy.image;
    return copy;
  }
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "image" && value instanceof File) {
      fd.append("image", value);
    } else if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  return fd;
};

export const getAnnouncements = (params) => api.get("/announcements", { params }).then((res) => res.data);
export const getActiveAnnouncements = () => api.get("/announcements/active").then((res) => res.data);
export const getAnnouncementById = (id) => api.get(`/announcements/${id}`).then((res) => res.data);
export const getCategories = () => api.get("/announcements/categories").then((res) => res.data);
export const getAnnouncementStats = () => api.get("/announcements/stats").then((res) => res.data);

export const createAnnouncement = (payload) => {
  return api.post("/announcements", toFormData(payload)).then((res) => res.data);
};

export const updateAnnouncement = (id, payload) => {
  return api.put(`/announcements/${id}`, toFormData(payload)).then((res) => res.data);
};

export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`).then((res) => res.data);
export const duplicateAnnouncement = (id) => api.post(`/announcements/${id}/duplicate`).then((res) => res.data);
export const bulkDeleteAnnouncements = (ids) => api.post("/announcements/bulk-delete", { ids }).then((res) => res.data);
export const bulkUpdateAnnouncements = (ids, changes) => api.post("/announcements/bulk-update", { ids, changes }).then((res) => res.data);
