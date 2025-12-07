import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from './auth'
import { api } from '../lib/api'

// Mock the API
jest.mock('../lib/api')
const mockApi = api as jest.Mocked<typeof api>

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.getState().logout()
    jest.clearAllMocks()
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'LABORATORIO',
          organizationId: 1,
          branchId: 1,
        },
      },
    }

    mockApi.post.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(result.current.user).toEqual(mockResponse.data.user)
    expect(result.current.token).toBe('mock-token')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle login error', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    }

    mockApi.post.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      try {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Invalid credentials')
  })

  it('should logout successfully', () => {
    const { result } = renderHook(() => useAuthStore())

    // First login
    act(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'LABORATORIO',
          organizationId: 1,
          branchId: 1,
        },
        token: 'mock-token',
      })
    })

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useAuthStore())

    // Set error
    act(() => {
      useAuthStore.setState({ error: 'Some error' })
    })

    // Clear error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})

