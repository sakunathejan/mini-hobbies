import api from "./api.js";

export const getProducts = (params) => api.get("/products", { params }).then((res) => res.data);
export const getFeaturedProducts = () => api.get("/products/featured").then((res) => res.data);
export const getNewArrivals = () => api.get("/products/new-arrivals").then((res) => res.data);
export const getProductBySlug = (slug) => api.get(`/products/${slug}`).then((res) => res.data);
export const getProductById = (id) => api.get(`/products/admin/${id}`).then((res) => res.data);
export const createProduct = (payload) => api.post("/products", payload).then((res) => res.data);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload).then((res) => res.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((res) => res.data);
export const getLowStockProducts = () => api.get("/products/low-stock").then((res) => res.data);
