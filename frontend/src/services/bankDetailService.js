import api from "./api.js";

export const getBankDetails = () => api.get("/bank-details").then((res) => res.data);

export const saveBankDetails = (data) => api.post("/bank-details", data).then((res) => res.data);