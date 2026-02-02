import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL
console.log(BASE_URL)
// Create an Axios instance
const HttpClient = axios.create({
    baseURL: BASE_URL, 
    // timeout: 10000, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token to headers
HttpClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('jwtToken'); // Get token from sesssionStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token.trim()}`; // Add Authorization header
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally (optional, but good practice)
HttpClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // You can add global error handling here, e.g., for 401 Unauthorized
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized request, redirecting to login...");
            // Optionally, clear token and redirect to login
            // localStorage.removeItem('jwtToken');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default HttpClient;