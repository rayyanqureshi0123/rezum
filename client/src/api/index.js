import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 60000, // 60s timeout — AI analysis can take a while
});

// ─── REQUEST INTERCEPTOR: Attach JWT token to every request ───
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

// ─── RESPONSE INTERCEPTOR: Handle expired tokens & rate limits globally ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    // Token expired or invalid — auto-logout the user
    if (status === 401 && (message.includes('expired') || message.includes('invalid token') || message.includes('no longer exists'))) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Rate limited — show a clear message
    if (status === 429) {
      const rateLimitMessage = message || 'Too many requests. Please slow down.';
      return Promise.reject(new Error(rateLimitMessage));
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  google: (credential) => api.post('/auth/google', { credential }),
};

export const resumeAPI = {
  analyze: (formData) => api.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min timeout for AI analysis specifically
  }),
  getHistory: () => api.get('/resume/history'),
  delete: (id) => api.delete(`/resume/${id}`),
};

export default api;
