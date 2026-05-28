import api from "./api.js";

export const getAdminReviews = (params) =>
  api.get("/reviews/admin", { params }).then((r) => r.data);

export const approveReview = (id) =>
  api.put(`/reviews/admin/${id}/approve`).then((r) => r.data);

export const rejectReview = (id, reason) =>
  api.put(`/reviews/admin/${id}/reject`, { reason }).then((r) => r.data);

export const featureReview = (id) =>
  api.put(`/reviews/admin/${id}/feature`).then((r) => r.data);

export const respondToReview = (id, response) =>
  api.post(`/reviews/admin/${id}/respond`, { response }).then((r) => r.data);

export const deleteReview = (id) =>
  api.delete(`/reviews/admin/${id}`).then((r) => r.data);
