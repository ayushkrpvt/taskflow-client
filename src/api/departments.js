import api from './client';

export const getDepartments = () => api.get('/departments').then(r => r.data);
export const createDepartment = (data) => api.post('/departments', data).then(r => r.data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data).then(r => r.data);
