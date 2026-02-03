import axios from 'axios';

// Use environment variable or fallback to production URL
const API_URL = import.meta.env.VITE_API_URL || 
  'https://chottola-e-commerce-website-backend.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add token to headers
api.interceptors.request.use(
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log all errors for debugging
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Only redirect if not on login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
