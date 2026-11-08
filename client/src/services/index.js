import api from './api';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadResume: (formData) => api.post('/users/resume', formData, multipart),
  downloadResume: () => api.get('/users/resume/download', { responseType: 'blob' }),
  deleteResume: () => api.delete('/users/resume'),
  uploadPhoto: (formData) => api.post('/users/photo', formData, multipart),
  changePassword: (data) => api.put('/users/change-password', data),
};

export const locationApi = {
  getAll: () => api.get('/locations'),
  getStates: () => api.get('/locations/states'),
};

export const jobApi = {
  list: (params) => api.get('/jobs', { params }),
  search: (params) => api.get('/jobs/search', { params }),
  privateJobs: (params) => api.get('/jobs/private', { params }),
  governmentJobs: (params) => api.get('/jobs/government', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  meta: () => api.get('/jobs/meta'),
  create: (data, isMultipart = false) => api.post('/jobs', data, isMultipart ? multipart : undefined),
  update: (id, data, isMultipart = false) => api.put(`/jobs/${id}`, data, isMultipart ? multipart : undefined),
  remove: (id) => api.delete(`/jobs/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/jobs/${id}/status`, { isActive }),
};

export const applicationApi = {
  apply: (data) => api.post('/applications', data),
  myApplications: (params) => api.get('/applications/my-applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  employerApplicants: (params) => api.get('/applications/employer', { params }),
  jobApplicants: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  adminApplications: (params) => api.get('/applications/admin', { params }),
  downloadResume: (id) => api.get(`/applications/${id}/resume`, { responseType: 'blob' }),
};

export const employerApi = {
  getProfile: () => api.get('/employer/profile'),
  updateProfile: (data, isMultipart = false) => api.put('/employer/profile', data, isMultipart ? multipart : undefined),
  dashboard: () => api.get('/employer/dashboard'),
  jobs: (params) => api.get('/employer/jobs', { params }),
  applicants: (params) => api.get('/employer/applicants', { params }),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  employers: (params) => api.get('/admin/employers', { params }),
  verifyEmployer: (id, data) => api.patch(`/admin/employers/${id}/verify`, data),
  jobs: (params) => api.get('/admin/jobs', { params }),
  approveJob: (id) => api.patch(`/admin/jobs/${id}/approve`),
  rejectJob: (id, reason) => api.patch(`/admin/jobs/${id}/reject`, { reason }),
  governmentVerification: (params) => api.get('/admin/government-verification', { params }),
  verifyGovernmentJob: (id, data) => api.patch(`/admin/government-verification/${id}`, data),
  applications: (params) => api.get('/admin/applications', { params }),
  messages: (params) => api.get('/admin/messages', { params }),
  updateMessage: (id, isRead) => api.patch(`/admin/messages/${id}`, { isRead }),
  deleteMessage: (id) => api.delete(`/admin/messages/${id}`),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const savedJobApi = {
  list: () => api.get('/saved-jobs'),
  save: (jobId) => api.post(`/saved-jobs/${jobId}`),
  remove: (jobId) => api.delete(`/saved-jobs/${jobId}`),
  check: (jobId) => api.get(`/saved-jobs/check/${jobId}`),
};

export const publicApi = {
  home: () => api.get('/home'),
  stats: () => api.get('/stats'),
  companies: (params) => api.get('/companies', { params }),
  company: (id) => api.get(`/companies/${id}`),
  contact: (data) => api.post('/contact', data),
};
