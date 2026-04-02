import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Safely extracts a readable error message from an Axios/API error.
 * NestJS can return `message` as a string, an array of strings, or the full
 * error object – this normalises all three cases.
 */
export function parseApiError(error: any, fallback = "Ocurrió un error inesperado"): string {
  const msg = error?.response?.data?.message ?? error?.response?.data ?? error?.message

  if (!msg) return fallback
  if (typeof msg === "string") return msg
  if (Array.isArray(msg)) return msg.join(", ")
  if (typeof msg === "object") {
    // e.g. { message: "...", error: "Bad Request", statusCode: 400 }
    const inner = (msg as any).message
    if (typeof inner === "string") return inner
    if (Array.isArray(inner)) return inner.join(", ")
    return JSON.stringify(msg)
  }
  return String(msg)
}
