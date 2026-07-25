import axios from "axios";
import { performanceMonitor } from "./performanceMonitor";

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/admin";
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Request interceptor
api.interceptors.request.use((config) => {
  // Start performance monitoring
  const requestLabel = `${config.method?.toUpperCase()} ${config.url}`;
  performanceMonitor.startTiming(requestLabel);
  config.metadata = { startTime: Date.now(), label: requestLabel };

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Note: Accept-Encoding is automatically handled by the browser

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // End performance monitoring
    if (response.config.metadata) {
      performanceMonitor.endTiming(response.config.metadata.label);
    }
    return response;
  },
  (error) => {
    // End performance monitoring on error
    if (error.config?.metadata) {
      performanceMonitor.endTiming(error.config.metadata.label);
    }

    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);

export { BASE_URL };
export default api;
