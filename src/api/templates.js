import api from './client';

export const getTemplates = () => api.get('/templates').then(r => r.data);
export const getTemplate = (id) => api.get(`/templates/${id}`).then(r => r.data);
export const createTemplate = (data) => api.post('/templates', data).then(r => r.data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data).then(r => r.data);
