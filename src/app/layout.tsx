import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CELHM - Sistema de Inventario y Laboratorio',
  description: 'SaaS Multi-tenant para inventario por sucursal y notas de laboratorio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

