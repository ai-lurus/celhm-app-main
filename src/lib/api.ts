import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry logic for network errors or 5xx status codes
    if (config && (!config._retryCount || config._retryCount < 3)) {
      const isNetworkError = !error.response;
      const isServerError = error.response && error.response.status >= 500 && error.response.status < 600;

      if (isNetworkError || isServerError) {
        config._retryCount = (config._retryCount || 0) + 1;

        // Exponential backoff
        const delay = Math.pow(2, config._retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        return api(config);
      }
    }

    if (error.response?.status === 401) {
      // Clear auth state on 401
      useAuthStore.getState().logout()
    }

    // Normalize error to always have a message
    let errorMessage = 'An error occurred'

    if (error.response?.data) {
      const errorData = error.response.data
      if (typeof errorData === 'string') {
        errorMessage = errorData
      } else if (typeof errorData === 'object') {
        if (errorData.message && typeof errorData.message === 'string') {
          errorMessage = errorData.message
        } else if (errorData.error && typeof errorData.error === 'string') {
          errorMessage = errorData.error
        } else {
          // If it's an object without a message, stringify it safely
          errorMessage = JSON.stringify(errorData)
        }
      }
    } else if (error.message && typeof error.message === 'string') {
      errorMessage = error.message
    }

    // Set global error for UI if it's not a handled 401 or expected validation error
    // We usually want to show toast for 500s or network errors that failed after retries
    if (!error.response || error.response.status >= 500) {
      import('../stores/error').then(({ useErrorStore }) => {
        useErrorStore.getState().setError(errorMessage);
      });
    }

    // Always create a proper Error object
    const normalizedError = new Error(errorMessage)
      ; (normalizedError as any).response = error.response
      ; (normalizedError as any).status = error.response?.status
      ; (normalizedError as any).originalError = error

    return Promise.reject(normalizedError)
  }
)

