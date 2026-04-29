import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (fullName: string, email: string, password: string) =>
    api.post('/auth/register', { fullName, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (fullName: string, location: string) =>
    api.put('/auth/profile', { fullName, location }),
};

// URLs API
export const urlsAPI = {
  createUrl: (data: {
    title: string;
    url: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => api.post('/urls', data),
  
  getUrls: (params?: { category?: string; search?: string; isFavorite?: boolean }) =>
    api.get('/urls', { params }),
  
  getUrl: (id: string) => api.get(`/urls/${id}`),
  
  updateUrl: (id: string, data: any) =>
    api.put(`/urls/${id}`, data),
  
  deleteUrl: (id: string) => api.delete(`/urls/${id}`),
  
  toggleFavorite: (id: string) =>
    api.patch(`/urls/${id}/favorite`),
};

export default api;
