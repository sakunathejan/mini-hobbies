import axios from "axios";
import { getSessionId } from "../utils/session.js";

const baseURL = import.meta.env.VITE_API_URL;

const customerApi = axios.create({
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

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("mini_hobbies_customer_token");
  config.headers["x-session-id"] = getSessionId();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 &&
        !originalRequest._retry &&
        !/\/auth\/(login|register|google|refresh)/.test(originalRequest.url || "")) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return customerApi(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${baseURL}/customers/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem("mini_hobbies_customer_token", data.token);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return customerApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("mini_hobbies_customer_token");
        window.dispatchEvent(new CustomEvent("customer:unauthorized"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default customerApi;
