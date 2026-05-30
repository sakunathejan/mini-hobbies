import customerApi from "./customerApi.js";

export const getCart = () =>
  customerApi.get("/cart").then((r) => r.data);

export const addToCartApi = (productId, quantity = 1, variantId = "") =>
  customerApi.post("/cart", { productId, quantity, variantId }).then((r) => r.data);

export const updateCartItemApi = (itemId, quantity, variantId = "") =>
  customerApi.patch(`/cart/${itemId}`, { quantity, variantId }).then((r) => r.data);

export const removeCartItemApi = (itemId, variantId = "") =>
  customerApi.delete(`/cart/${itemId}${variantId ? `?variantId=${encodeURIComponent(variantId)}` : ""}`).then((r) => r.data);

export const mergeCart = (sessionId) =>
  customerApi.post("/cart/merge", { sessionId }).then((r) => r.data);
