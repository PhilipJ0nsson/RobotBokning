import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const API_URL = isDevelopment ? 'http://localhost:5069' : '';

// Create axios instance with default settings
const instance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add authentication token to each request
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Export for use in other files
export { API_URL };
export default instance;