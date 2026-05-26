import customerApi from "./customerApi.js";

const PREFIX = "/customers";

export const getMyOrders = (params = {}) =>
  customerApi.get(`${PREFIX}/auth/orders`, { params }).then((r) => r.data);

export const getMyOrder = (id) =>
  customerApi.get(`${PREFIX}/auth/orders/${id}`).then((r) => r.data);
