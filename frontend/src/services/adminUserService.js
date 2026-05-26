import api from "./api.js";

export const getUsers = (params = {}) =>
  api.get("/admin/users", { params }).then((r) => r.data);

export const getUserById = (id) =>
  api.get(`/admin/users/${id}`).then((r) => r.data);

export const updateUser = (id, data) =>
  api.patch(`/admin/users/${id}`, data).then((r) => r.data);

export const suspendUser = (id) =>
  api.post(`/admin/users/${id}/suspend`).then((r) => r.data);

export const reactivateUser = (id) =>
  api.post(`/admin/users/${id}/reactivate`).then((r) => r.data);

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then((r) => r.data);

export const resetUserPassword = (id, newPassword) =>
  api.post(`/admin/users/${id}/reset-password`, { newPassword }).then((r) => r.data);

export const verifyUserEmail = (id, verified) =>
  api.post(`/admin/users/${id}/verify-email`, { verified }).then((r) => r.data);

export const forceLogoutUser = (id) =>
  api.post(`/admin/users/${id}/force-logout`).then((r) => r.data);

export const addAdminNote = (id, text) =>
  api.post(`/admin/users/${id}/notes`, { text }).then((r) => r.data);

export const getUserOrders = (id, params = {}) =>
  api.get(`/admin/users/${id}/orders`, { params }).then((r) => r.data);

export const getUserLoginHistory = (id, params = {}) =>
  api.get(`/admin/users/${id}/login-history`, { params }).then((r) => r.data);

export const bulkSuspendUsers = (ids) =>
  api.post("/admin/users/bulk-suspend", { ids }).then((r) => r.data);

export const bulkActivateUsers = (ids) =>
  api.post("/admin/users/bulk-activate", { ids }).then((r) => r.data);

export const bulkDeleteUsers = (ids) =>
  api.post("/admin/users/bulk-delete", { ids }).then((r) => r.data);

export const exportUsers = (params = {}) =>
  api.get("/admin/users/export", { params, responseType: "blob" }).then((r) => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `customers-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

export const getUserStats = () =>
  api.get("/admin/users/stats").then((r) => r.data);
