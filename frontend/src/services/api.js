import axios from "axios";
import { getSessionId } from "../utils/session.js";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  console.warn("[api] VITE_API_URL is not set. API calls will fail in production.");
}

const api = axios.create({
  baseURL: baseURL || "",
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
