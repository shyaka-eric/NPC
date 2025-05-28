import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from './store/authStore'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
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
    if (response?.status === 401 && !config._retry) {
      config._retry = true
      try {
        await useAuthStore.getState().refreshToken()
        return api.request(config)
      } catch {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)
