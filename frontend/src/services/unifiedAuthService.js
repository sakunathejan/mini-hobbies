import api from "./api.js";
import customerApi from "./customerApi.js";

const UNIFIED_PREFIX = "/unified";

export const unifiedLogin = (payload) =>
  api.post(`${UNIFIED_PREFIX}/login`, payload).then((r) => r.data);

export const unifiedLogout = () =>
  api.post(`${UNIFIED_PREFIX}/logout`).then((r) => r.data);

export const adminForgotPassword = (payload) =>
  api.post("/auth/forgot-password", payload).then((r) => r.data);

export const adminResetPassword = (payload) =>
  api.post("/auth/reset-password", payload).then((r) => r.data);

export const customerForgotPassword = (payload) =>
  customerApi.post("/customers/auth/forgot-password", payload).then((r) => r.data);

export const customerResetPassword = (payload) =>
  customerApi.post("/customers/auth/reset-password", payload).then((r) => r.data);
