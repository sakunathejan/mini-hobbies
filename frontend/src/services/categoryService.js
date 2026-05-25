import api from "./api.js";

export const getCategories = () => api.get("/categories").then((res) => res.data);
export const createCategory = (payload) => api.post("/categories", payload).then((res) => res.data);
export const updateCategory = (id, payload) => api.put(`/categories/${id}`, payload).then((res) => res.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((res) => res.data);
