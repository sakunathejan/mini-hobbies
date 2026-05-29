import api from "./api.js";

export const sendMessage = (message, context = {}) =>
  api.post("/chat/message", { message, context }).then((r) => r.data);

export const trackOrder = (orderNumber, phone) =>
  api.post("/chat/track-order", { orderNumber, phone }).then((r) => r.data);

export const getSuggestions = () =>
  api.get("/chat/suggestions").then((r) => r.data);
