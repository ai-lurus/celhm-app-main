'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error)
  }, [error])

  // Extract error message safely - ensure we always return a string
  const extractErrorMessage = (err: any): string => {
    if (!err) return 'Ocurrió un error inesperado'
    
    // If it's already a string, return it
    if (typeof err === 'string') return err
    
    // If it's an Error object with a string message
    if (err instanceof Error && typeof (err as any).message === 'string') {
      return (err as any).message
    }
    
    // Handle error objects with message property
    if (err?.message) {
      if (typeof err.message === 'string') {
        return err.message
      }
      // If message is an object, recurse
      if (typeof err.message === 'object' && err.message !== null) {
        return extractErrorMessage(err.message)
      }
    }
    
    // Handle error objects with error property
    if (err?.error) {
      if (typeof err.error === 'string') {
        return err.error
      }
      if (typeof err.error === 'object' && err.error !== null) {
        return extractErrorMessage(err.error)
      }
    }
    
    // Handle response.data structure (from axios)
    if (err?.response?.data) {
      const data = err.response.data
      if (typeof data === 'string') return data
      if (data?.message && typeof data.message === 'string') return data.message
      if (data?.error && typeof data.error === 'string') return data.error
    }
    
    // Last resort: try to stringify, but limit length
    try {
      const str = JSON.stringify(err)
      return str.length > 200 ? str.substring(0, 200) + '...' : str
    } catch {
      return 'Ocurrió un error inesperado'
    }
  }
  
  const errorMessage = extractErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">¡Algo salió mal!</h2>
        <p className="text-gray-700 mb-4">{errorMessage}</p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}

