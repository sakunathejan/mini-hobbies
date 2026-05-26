import customerApi from "./customerApi.js";

const PREFIX = "/customers";

export const registerCustomer = (payload) => customerApi.post(`${PREFIX}/auth/register`, payload).then((r) => r.data);
export const loginCustomer = (payload) => customerApi.post(`${PREFIX}/auth/login`, payload).then((r) => r.data);
export const refreshCustomerToken = () => customerApi.post(`${PREFIX}/auth/refresh`).then((r) => r.data);
export const logoutCustomer = () => customerApi.post(`${PREFIX}/auth/logout`).then((r) => r.data);
export const verifyEmail = (token) => customerApi.get(`${PREFIX}/auth/verify-email/${token}`).then((r) => r.data);
export const resendVerification = () => customerApi.post(`${PREFIX}/auth/resend-verification`).then((r) => r.data);
export const forgotPassword = (payload) => customerApi.post(`${PREFIX}/auth/forgot-password`, payload).then((r) => r.data);
export const resetPassword = (payload) => customerApi.post(`${PREFIX}/auth/reset-password`, payload).then((r) => r.data);

export const getCustomerProfile = () => customerApi.get(`${PREFIX}/auth/me`).then((r) => r.data);
export const updateCustomerProfile = (payload) => customerApi.put(`${PREFIX}/auth/me`, payload).then((r) => r.data);
export const changeCustomerPassword = (payload) => customerApi.put(`${PREFIX}/auth/me/password`, payload).then((r) => r.data);
export const updateCustomerPreferences = (payload) => customerApi.put(`${PREFIX}/auth/me/preferences`, payload).then((r) => r.data);
export const deleteCustomerAccount = (payload) => customerApi.post(`${PREFIX}/auth/me/delete`, payload).then((r) => r.data);

export const getAddresses = () => customerApi.get(`${PREFIX}/auth/addresses`).then((r) => r.data);
export const addAddress = (payload) => customerApi.post(`${PREFIX}/auth/addresses`, payload).then((r) => r.data);
export const updateAddress = (id, payload) => customerApi.put(`${PREFIX}/auth/addresses/${id}`, payload).then((r) => r.data);
export const deleteAddress = (id) => customerApi.delete(`${PREFIX}/auth/addresses/${id}`).then((r) => r.data);
