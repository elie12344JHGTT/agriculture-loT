import axios from 'axios';

const AUTH_STORAGE_KEY = 'agro-iot-auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://agro-iot-backend.onrender.com',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    try {
        const storedAuth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
        const token = storedAuth?.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';

        if (error.response?.status === 401 && !url.includes('/auth/login')) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }

        return Promise.reject(error);
    }
);
export default api;

