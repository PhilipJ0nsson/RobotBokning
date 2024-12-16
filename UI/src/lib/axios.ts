import axios from 'axios';

// Lägg till denna export-konstant
const API_URL = 'https://localhost:7285';

const instance = axios.create({
    baseURL: API_URL,  // Använd API_URL konstanten här
    headers: {
        'Content-Type': 'application/json'
    }
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Exportera både instansen och API_URL
export { API_URL };
export default instance;