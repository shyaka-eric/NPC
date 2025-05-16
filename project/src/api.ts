import axios from "axios";
import { useAuthStore } from './store/authStore';

export const API_URL = "http://localhost:8000/api/"; // Directly use the backend URL without relying on the proxy

export const api = axios.create({
  baseURL: API_URL,
  // You can add headers here if you use authentication
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Token:', token); // Debugging log
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await useAuthStore.getState().refreshToken();
        return api.request(error.config);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        throw refreshError;
      }
    }
    throw error;
  }
);