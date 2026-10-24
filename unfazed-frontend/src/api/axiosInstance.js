import axios from 'axios';

export const CLOUD_API_URL = 'https://unfazed-backend-dphs.onrender.com/api';
export const LOCAL_API_URL = 'http://localhost:5000/api';
export const CLOUD_SOCKET_URL = 'https://unfazed-backend-dphs.onrender.com';
export const LOCAL_SOCKET_URL = 'http://localhost:5000';

export const isProductionDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0';
};

export const getBaseURL = () => {
  if (isProductionDomain()) {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return CLOUD_API_URL;
  }
  return import.meta.env.VITE_API_BASE_URL || LOCAL_API_URL;
};

export const getSocketURL = () => {
  if (isProductionDomain()) {
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return CLOUD_SOCKET_URL;
  }
  return import.meta.env.VITE_SOCKET_URL || LOCAL_SOCKET_URL;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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

// Interceptor to handle responses, automatic local->cloud fallback, and global entitlement error triggers
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Automatic failover: if local backend is down or unreachable, retry transparently via cloud backend
    if (
      (!error.response || error.code === 'ERR_NETWORK') &&
      config &&
      !config._fallbackRetried &&
      (api.defaults.baseURL.includes('localhost') || api.defaults.baseURL.includes('127.0.0.1'))
    ) {
      console.warn(
        `[Unfazed API] Local backend at ${api.defaults.baseURL} is unreachable. Seamlessly failing over to cloud API at ${CLOUD_API_URL}`
      );
      config._fallbackRetried = true;
      api.defaults.baseURL = CLOUD_API_URL;
      config.baseURL = CLOUD_API_URL;
      try {
        return await axios(config);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    if (error.response) {
      // 403 Forbidden with upgradeRequired flag (Entitlement Tier Gate)
      if (error.response.status === 403 && error.response.data?.upgradeRequired) {
        window.dispatchEvent(
          new CustomEvent('unfazed_upgrade_required', {
            detail: error.response.data,
          })
        );
      }

      // 401 Unauthorized
      if (error.response.status === 401) {
        const path = window.location.pathname;
        if (
          path.startsWith('/dashboard') ||
          path.startsWith('/clients') ||
          path.startsWith('/schedule') ||
          path.startsWith('/notes') ||
          path.startsWith('/analytics')
        ) {
          localStorage.removeItem('unfazed_token');
          localStorage.removeItem('unfazed_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
