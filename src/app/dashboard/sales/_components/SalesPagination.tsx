'use client'

interface SalesPaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function SalesPagination({ page, totalPages, total, pageSize, onPageChange }: SalesPaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-t border-border">
      <div className="text-sm text-muted-foreground">
        Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} ventas
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
