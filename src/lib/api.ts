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
  (error) => {
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
    
    // Always create a proper Error object
    const normalizedError = new Error(errorMessage)
    ;(normalizedError as any).response = error.response
    ;(normalizedError as any).status = error.response?.status
    ;(normalizedError as any).originalError = error
    
    return Promise.reject(normalizedError)
  }
)

