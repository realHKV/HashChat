import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
};

// User endpoints
export const userAPI = {
  
  getProfile: () => api.get('/user/profile'),
  updateProfile: (formData) => {
    return axios.put(`${API_BASE_URL}/user/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
  checkUsername: (username) => api.get(`/user/check-username?username=${username}`),
};

export default api;