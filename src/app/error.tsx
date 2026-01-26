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

  // Extract error message safely - handle both Error objects and API error objects
  const getErrorMessage = (err: any): string => {
    if (!err) return 'Ocurrió un error inesperado'
    
    // If it's a string, return it
    if (typeof err === 'string') return err
    
    // If it's an Error object, return the message
    if (err instanceof Error) {
      return (err as Error).message || 'Ocurrió un error'
    }
    
    // If it's an object, extract the message property safely
    if (err && typeof err === 'object') {
      // Check for message property (most common)
      if (err.message !== undefined) {
        if (typeof err.message === 'string' && err.message.trim()) {
          return err.message
        }
        // If message exists but is not a string, try to convert it
        if (typeof err.message === 'object') {
          // If message is itself an object, try to extract from it
          if (err.message.message && typeof err.message.message === 'string') {
            return err.message.message
          }
        }
      }
      
      // Check for error property
      if (err.error !== undefined) {
        if (typeof err.error === 'string' && err.error.trim()) {
          return err.error
        }
        if (typeof err.error === 'object' && err.error.message && typeof err.error.message === 'string') {
          return err.error.message
        }
      }
      
      // If there's a statusCode, create a meaningful message
      if (err.statusCode !== undefined) {
        const statusCode = err.statusCode
        const message = err.message && typeof err.message === 'string' ? err.message : 'Ocurrió un error en el servidor'
        return `Error ${statusCode}: ${message}`
      }
      
      // Last resort: try to stringify safely (but avoid circular references)
      try {
        const stringified = JSON.stringify(err)
        if (stringified && stringified !== '{}') {
          return `Error: ${stringified.substring(0, 200)}`
        }
      } catch (e) {
        // If stringify fails, return generic message
      }
    }
    
    return 'Ocurrió un error inesperado'
  }

  const errorMessage = getErrorMessage(error)

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

