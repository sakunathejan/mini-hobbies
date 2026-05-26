import axios from "axios";
import { getSessionId } from "../utils/session.js";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: baseURL || "",
  timeout: 15000,
  withCredentials: true,
  headers: { "x-csrf-token": "1" }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mini_hobbies_admin_token");
  config.headers["x-session-id"] = getSessionId();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 &&
        error.response?.data?.message?.includes("Token expired") &&
        !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem("mini_hobbies_admin_token", data.token);
        localStorage.setItem("mini_hobbies_admin", JSON.stringify(data.user));
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("mini_hobbies_admin_token");
        localStorage.removeItem("mini_hobbies_admin");
        window.location.href = "/admin/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
