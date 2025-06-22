import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from './store/authStore'
import { toast } from 'sonner'

// Use the same API_URL as config.ts and .env (no /api at the end)
export const API_URL = "https://logistics-backend-qh1y.onrender.com"

export const api = axios.create({
  baseURL: `${API_URL}/api/`,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async (error) => {
    const { response, config } = error
    
    // Handle different error cases
    if (!response) {
      // Network error
      toast.error('Network error. Please check your internet connection.')
      return Promise.reject(error)
    }

    if (response?.status === 401) {
      // Token expired or invalid
      if (!config._retry) {
        config._retry = true
        // Handle token refresh here if needed
        try {
          await useAuthStore.getState().refreshToken()
          return api.request(config)
        } catch {
          useAuthStore.getState().logout()
        }
      }
      toast.error('Session expired. Please login again.')
      window.location.href = '/login'
    }

    if (response?.status === 403) {
      toast.error('Access denied. You don\'t have permission to access this resource.')
    }

    if (response?.status === 404) {
      toast.error('Resource not found.')
    }

    if (response?.status >= 500) {
      toast.error('Server error occurred. Please try again later.')
    }

    // Return the error for other cases
    return Promise.reject(error)
  }
)


