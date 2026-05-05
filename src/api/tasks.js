import api from './client';

export const getTasks = (params) => api.get('/tasks', { params }).then(r => r.data);
export const getTask = (id) => api.get(`/tasks/${id}`).then(r => r.data);
export const createTask = (data) => api.post('/tasks', data).then(r => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data);
export const assignTask = (id, data) => api.patch(`/tasks/${id}/assign`, data).then(r => r.data);
export const updateTaskStatus = (id, data) => api.patch(`/tasks/${id}/status`, data).then(r => r.data);

export const presignUpload = (data) => api.post('/attachments/presign', data).then(r => r.data);
export const confirmUpload = (data) => api.post('/attachments/confirm', data).then(r => r.data);
export const deleteAttachment = (id) => api.delete(`/attachments/${id}`).then(r => r.data);

export const addComment = (data) => api.post('/comments', data).then(r => r.data);
export const deleteComment = (id) => api.delete(`/comments/${id}`).then(r => r.data);
