import api from './client';

export const getTerritories = (params) => api.get('/territories', { params }).then(r => r.data);
export const createTerritory = (data) => api.post('/territories', data).then(r => r.data);
export const updateTerritory = (id, data) => api.put(`/territories/${id}`, data).then(r => r.data);
export const deleteTerritory = (id) => api.delete(`/territories/${id}`).then(r => r.data);
export const getUserTerritories = (userId) => api.get(`/territories/users/${userId}`).then(r => r.data);
export const setUserTerritories = (userId, territory_ids) => api.put(`/territories/users/${userId}`, { territory_ids }).then(r => r.data);
