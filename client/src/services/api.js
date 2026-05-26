import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventsphere_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Utility function to get proper image URL
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  // If it's already a full URL or data URI, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  // If it's a relative path, prepend API_URL
  return `${API_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
};

export default api;

