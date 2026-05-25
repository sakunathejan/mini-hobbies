import axios from "axios";
import { getSessionId } from "../utils/session.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mini_hobbies_admin_token");
  config.headers["x-session-id"] = getSessionId();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
