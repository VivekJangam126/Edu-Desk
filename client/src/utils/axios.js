import axios from 'axios';
import API_BASE_URL from '../config/api';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Configure default axios to use the same base URL
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 30000;

export default axiosInstance;