import customerApi from "./customerApi.js";
import api from "./api.js";

export const toggleReaction = (reviewId, reactionType) =>
  customerApi.post("/reviews/reactions/toggle", { reviewId, reactionType }).then((r) => r.data);

export const getReactionSummary = (reviewId) =>
  api.get(`/reviews/reactions/summary/${reviewId}`).then((r) => r.data);

export const getEngagementStats = () =>
  api.get("/reviews/reactions/admin/stats").then((r) => r.data);

export const removeReactionAdmin = (reviewId, userId, reactionType) =>
  api.delete("/reviews/reactions/admin/remove", { data: { reviewId, userId, reactionType } }).then((r) => r.data);
