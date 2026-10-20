import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // If running in production (e.g. on Vercel)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://unfazed-backend-dphs.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to append JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unfazed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and global entitlement error triggers
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 403 Forbidden with upgradeRequired flag
      if (error.response.status === 403 && error.response.data?.upgradeRequired) {
        window.dispatchEvent(
          new CustomEvent('unfazed_upgrade_required', {
            detail: error.response.data,
          })
        );
      }

      // 401 Unauthorized
      if (error.response.status === 401) {
        // If expired or invalid token on protected route, clean up
        const path = window.location.pathname;
        if (path.startsWith('/dashboard') || path.startsWith('/clients') || path.startsWith('/schedule') || path.startsWith('/notes') || path.startsWith('/analytics')) {
          localStorage.removeItem('unfazed_token');
          localStorage.removeItem('unfazed_user');
          // Optional redirect if needed
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
