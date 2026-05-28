import customerApi from "./customerApi.js";
import api from "./api.js";

export const getProductReviews = (productId, params) =>
  api.get(`/reviews/product/${productId}`, { params }).then((r) => r.data);

export const getMyReviews = (params) =>
  customerApi.get("/reviews/mine", { params }).then((r) => r.data);

export const createReview = (data) =>
  customerApi.post("/reviews", data).then((r) => r.data);

export const updateReview = (id, data) =>
  customerApi.put(`/reviews/${id}`, data).then((r) => r.data);

export const deleteMyReview = (id) =>
  customerApi.delete(`/reviews/${id}`).then((r) => r.data);
