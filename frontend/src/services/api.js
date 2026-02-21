import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("codearena_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("codearena_token");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(err);
  }
);

export const getWsUrl = (path) => {
  const base = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://");
  return `${base}/api/ws${path}`;
};

export default api;
