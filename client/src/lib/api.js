import axios from 'axios';

// In production (Vercel), VITE_API_URL must be set to the Render backend URL
// e.g. https://your-app.onrender.com/api
// In local dev the Vite proxy handles /api so we fall back to '/api'
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
});

const STORAGE_KEY = 'sa_auth';

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return Promise.reject(err);
  }
);

export default api;
