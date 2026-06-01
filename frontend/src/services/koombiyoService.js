import api from "./api.js";

const ADMIN = "/koombiyo/admin";
const PUBLIC = "/koombiyo";

export const createKoombiyoShipment = (orderId) =>
  api.post(`${ADMIN}/shipments/create/${orderId}`).then((r) => r.data);

export const refreshKoombiyoTracking = (orderId) =>
  api.get(`${ADMIN}/shipments/${orderId}/tracking`).then((r) => r.data);

export const getCustomerKoombiyoTracking = (orderId) =>
  api.get(`${PUBLIC}/tracking/${orderId}`).then((r) => r.data);

export const getKoombiyoWaybills = () =>
  api.get(`${ADMIN}/waybills`).then((r) => r.data);

export const getKoombiyoDistricts = () =>
  api.get(`${PUBLIC}/districts`).then((r) => r.data);

export const getKoombiyoCities = (districtId) =>
  api.get(`${PUBLIC}/cities/${districtId}`).then((r) => r.data);

export const requestKoombiyoPickup = (data) =>
  api.post(`${ADMIN}/pickup`, data).then((r) => r.data);

export const getKoombiyoReturnNotes = () =>
  api.get(`${ADMIN}/return-notes`).then((r) => r.data);

export const getKoombiyoReturnItems = (noteId) =>
  api.get(`${ADMIN}/return-items/${noteId}`).then((r) => r.data);

export const processKoombiyoReturnReceive = (waybillId) =>
  api.post(`${ADMIN}/return-receive/${waybillId}`).then((r) => r.data);

export const syncAllKoombiyoDeliveries = () =>
  api.post(`${ADMIN}/sync`).then((r) => r.data);
