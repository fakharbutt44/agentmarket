import axios from 'axios';

//const api = axios.create({ baseURL: '/api' });


// CHANGE TO:
const api = axios.create({ 
  baseURL: process.env.REACT_APP_SERVER_URL 
    ? `${process.env.REACT_APP_SERVER_URL}/api` 
    : '/api' 
});


// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),
  getDepositAddress: () => api.get('/wallet/deposit-address'),
  simulateDeposit: (amount) => api.post('/wallet/simulate-deposit', { amount }),
  sync: () => api.post('/wallet/sync'),
};

export const jobApi = {
  run: (prompt) => api.post('/jobs/run', { prompt }),
  getSessions: (page = 1) => api.get(`/jobs/sessions?page=${page}`),
  getSession: (id) => api.get(`/jobs/sessions/${id}`),
  getStats: () => api.get('/jobs/stats'),
};

export const agentApi = {
  getAll: () => api.get('/agents'),
};

export const txApi = {
  getAll: (page = 1) => api.get(`/transactions?page=${page}`),
};

export default api;
