import customerApi from "./customerApi.js";

export const getWishlist = () =>
  customerApi.get("/wishlist").then((r) => r.data);

export const toggleWishlistApi = (productId) =>
  customerApi.post("/wishlist/toggle", { productId }).then((r) => r.data);

export const mergeWishlist = (sessionId) =>
  customerApi.post("/wishlist/merge", { sessionId }).then((r) => r.data);
