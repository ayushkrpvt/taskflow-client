import api from './client';

export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
export const me = () => api.get('/auth/me').then(r => r.data);
