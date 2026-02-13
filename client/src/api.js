import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAnalytics = () => api.get('/analytics/dashboard');
export const getReviewQueue = (status = 'pending') => api.get(`/admin/queue?status=${status}`);
export const approveContent = (id, notes) => api.post(`/admin/${id}/approve`, { notes });
export const rejectContent = (id, reason) => api.post(`/admin/${id}/reject`, { reason });
export const getAppeals = () => api.get('/appeals/pending');
export const resolveAppeal = (id, decision, notes) => 
  api.post(`/appeals/${id}/resolve`, { decision, resolution_notes: notes });

export default api;
