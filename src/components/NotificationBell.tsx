
'use client'

import { useState, useRef, useEffect } from 'react'
import { useStockAlerts } from '../lib/hooks/useStockAlerts'
import Link from 'next/link'

export function NotificationBell() {
    const { data: alerts = [], isLoading } = useStockAlerts()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const unreadCount = alerts.length

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                title="Notificaciones"
            >
                <span className="sr-only">Ver notificaciones</span>
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                    </div>

                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Cargando...</div>
                    ) : unreadCount === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No tienes notificaciones pendientes</div>
                    ) : (
                        <div>
                            <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-100">
                                <p className="text-xs text-yellow-800 font-medium">
                                    {unreadCount} Productos con stock bajo
                                </p>
                            </div>
                            {alerts.map((alert) => (
                                <div key={alert.id} className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                Stock Bajo: {alert.variant.product.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {alert.variant.sku} - {alert.variant.product.brand} {alert.variant.product.model}
                                            </p>
                                            <div className="mt-2 text-xs flex justify-between items-center">
                                                <span className="font-semibold text-red-600">
                                                    Quedan: {alert.qty} (Mín: {alert.min})
                                                </span>
                                                <Link
                                                    href={`/dashboard/inventory?q=${alert.variant.sku}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Ver en inventario
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
