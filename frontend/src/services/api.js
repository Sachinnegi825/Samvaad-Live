import axios from 'axios';

/**
 * Axios Instance (api.js)
 * 
 * Instead of writing the full URL every time (axios.post('http://localhost:5000/api/auth/login')),
 * we create a pre-configured instance with a base URL.
 * 
 * The request interceptor automatically reads the JWT token from localStorage
 * and attaches it to the Authorization header of every outgoing request.
 * This means we never have to manually add the token anywhere.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — runs before every request is sent
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('samvaad_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
