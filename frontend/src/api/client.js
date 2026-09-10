import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api', timeout: 15000 });
api.interceptors.request.use((config) => { const token = localStorage.getItem('railvista.token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, (error) => {
	if (error.response?.status === 401) {
		localStorage.removeItem('railvista.token');
		localStorage.removeItem('railvista.session');
		if (window.location.pathname !== '/login') window.location.assign('/login');
	}
	return Promise.reject(error);
});
export const planningApi = { generate: (payload) => api.post('/planning-runs', payload), health: () => api.get('/health') };
