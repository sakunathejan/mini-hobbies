import api from "./api.js";

export const getCities = () => api.get("/delivery/cities").then((r) => r.data);
export const calculateDelivery = (city, items) => api.post("/delivery/calculate", { city, items }).then((r) => r.data);
