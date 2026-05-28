import customerApi from "./customerApi.js";
import api from "./api.js";

export const getReplies = (reviewId) =>
  api.get(`/reviews/replies/${reviewId}`).then((r) => r.data);

export const createReply = (reviewId, message, parentReplyId) =>
  customerApi.post("/reviews/replies", { reviewId, message, parentReplyId }).then((r) => r.data);

export const editReply = (replyId, message) =>
  customerApi.put(`/reviews/replies/${replyId}`, { message }).then((r) => r.data);

export const deleteReply = (replyId) =>
  customerApi.delete(`/reviews/replies/${replyId}`).then((r) => r.data);

export const deleteReplyAdmin = (replyId) =>
  api.delete(`/reviews/replies/admin/${replyId}`).then((r) => r.data);
