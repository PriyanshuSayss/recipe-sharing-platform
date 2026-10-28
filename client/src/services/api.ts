import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach authorization errors
api.interceptors.response.use(
  response => response,
  error => {
    // Don't log 401 as errors — they're expected for unauthenticated routes
    return Promise.reject(error);
  }
);

export default api;
