import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000', //  Communication avec le backend Laravel
    withCredentials: true,           // Important pour les sessions/cookies
});

export default api;