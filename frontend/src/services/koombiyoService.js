import api from "./api.js";

export const createKoombiyoShipment = (orderId) =>
  api.post(`/integrations/koombiyo/shipment/create/${orderId}`).then((r) => r.data);

export const refreshKoombiyoTracking = (orderId) =>
  api.get(`/integrations/koombiyo/tracking/${orderId}`).then((r) => r.data);

export const getCustomerKoombiyoTracking = (orderId) =>
  api.get(`/integrations/koombiyo/tracking/customer/${orderId}`).then((r) => r.data);
