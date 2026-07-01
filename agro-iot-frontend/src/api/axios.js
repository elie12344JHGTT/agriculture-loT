import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000', // Communication avec le backend Laravel
    withCredentials: true,            // Doit être true car cors.php a supports_credentials: true
    withXSRFToken: true,              // Nécessaire si vous utilisez Sanctum (cookie CSRF) plus tard
    headers: {
        'Accept': 'application/json',
    },
});

export default api;