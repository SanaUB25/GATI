import { api } from './client.js';

export const operationsApi = {
  tasks: (params = {}) => api.get('/tasks', { params }),
  plans: (runId, params = {}) => api.get(`/planning-runs/${runId}/plans`, { params }),
  plan: (id) => api.get(`/plans/${id}`),
  createPlan: (payload) => api.post('/plans', payload),
  updatePlan: (id, payload) => api.patch(`/plans/${id}`, payload),
  deletePlan: (id) => api.delete(`/plans/${id}`),
  updatePlanStatus: (id, status) => api.post(`/plans/${id}/status`, { status }),
  simulations: (planId, params = {}) => api.get(`/plans/${planId}/simulations`, { params }),
  risk: (planId) => api.get(`/plans/${planId}/risk`),
  reports: (type, params = {}) => api.get('/reports', { params: { type, ...params } }),
  notifications: (params = {}) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.post(`/notifications/${id}/read`),
  users: (params = {}) => api.get('/users', { params }),
  audit: (params = {}) => api.get('/audit-logs', { params })
};
