'use client'

import { ReactNode, useEffect, useId } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const CONFIRM_TONE: Record<NonNullable<ConfirmDialogProps['tone']>, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  danger: 'bg-red-600 hover:bg-red-700',
}

export function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
        <h2 id={titleId} className="text-xl font-bold text-foreground">{title}</h2>
        <div className="text-muted-foreground mt-4 space-y-2">{children}</div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${CONFIRM_TONE[tone]} text-white px-6 py-2 rounded-md disabled:opacity-50`}
          >
            {isLoading ? 'Guardando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
