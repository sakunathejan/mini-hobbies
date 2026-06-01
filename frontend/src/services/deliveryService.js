import api from "./api.js";

export const getCities = () => api.get("/delivery/cities").then((r) => r.data);

export const getDistricts = () => api.get("/koombiyo/districts").then((r) => r.data);

export const getCitiesByDistrict = (districtId) => api.get(`/koombiyo/cities/${districtId}`).then((r) => r.data);

export const calculateDelivery = (city, items) => api.post("/delivery/calculate", { city, items }).then((r) => r.data);
