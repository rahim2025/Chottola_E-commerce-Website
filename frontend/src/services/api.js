import axios from 'axios';

const API_URL = "https://chottola-e-commerce-website-git-613bf5-mohammad-rahims-projects.vercel.app/api" ||'https://chottola-e-commerce-website-backend.vercel.app/api'|| 'http://localhost:5000/api';

const api = axios.create({
  baseURL: "https://chottola-e-commerce-website-backend.vercel.app/api",
  headers: {
    'Content-Type': 'application/json'
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
