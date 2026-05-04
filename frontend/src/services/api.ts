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
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
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

  getCategories: () => api.get('/urls/categories'),
  getAnalytics: () => api.get('/urls/analytics'),
  createCategory: (name: string) => api.post('/urls/categories', { name }),
  renameCategory: (currentName: string, name: string) =>
    api.patch(`/urls/categories/${encodeURIComponent(currentName)}`, { name }),
  
  getUrl: (id: string) => api.get(`/urls/${id}`),
  
  updateUrl: (id: string, data: any) =>
    api.put(`/urls/${id}`, data),
  
  deleteUrl: (id: string) => api.delete(`/urls/${id}`),
  
  toggleFavorite: (id: string) =>
    api.patch(`/urls/${id}/favorite`),

  togglePin: (id: string) =>
    api.patch(`/urls/${id}/pin`),

  createSecretUrl: (data: {
    title: string;
    url: string;
    category?: string;
    password: string;
  }) => api.post('/urls/secret', data),

  unlockSecretUrls: (password: string) =>
    api.post('/urls/secret/unlock', { password }),

  toggleSecret: (id: string, password: string) =>
    api.put(`/urls/${id}/toggle-secret`, { password }),
};

export default api;
