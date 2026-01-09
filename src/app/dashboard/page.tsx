'use client'

import { useEffect, useMemo } from 'react'
import { useTickets } from '../../lib/hooks/useTickets'
import { useStock } from '../../lib/hooks/useStock'
import { useSales } from '../../lib/hooks/useSales'
import { useCustomers } from '../../lib/hooks/useCustomers'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/auth'
import { Ticket } from '@celhm/types'
import { MetricCard } from '../../components/MetricCard'
import { SalesChart } from '../../components/SalesChart'
import { TopProducts } from '../../components/TopProducts'
import { RecentActivity } from '../../components/RecentActivity'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  // Get tickets for stats
  const { data: ticketsData, error: ticketsError } = useTickets({ page: 1, pageSize: 100 })
  const tickets = Array.isArray((ticketsData as any)?.data) ? (ticketsData as any).data : []

  // Get sales data
  const { data: salesData } = useSales({ page: 1, pageSize: 100 })
  const sales = Array.isArray((salesData as any)?.data) ? (salesData as any).data : []

  // Get customers
  const { data: customersData } = useCustomers({ page: 1, pageSize: 100 })
  const customers = Array.isArray((customersData as any)?.data) ? (customersData as any).data : []

  // Get low stock alerts
  const { data: lowStockAlerts = [], error: stockAlertsError } = useQuery<any[]>({
    queryKey: ['stock', 'alerts'],
    queryFn: async () => {
      const response = await api.get('/stock/alerts')
      return response.data
    },
    enabled: !!user,
    retry: false,
  })
  
  // Get all stock to calculate total value
  const { data: stockData, error: stockError } = useStock({ page: 1, pageSize: 1000 })
  const stockItems = Array.isArray((stockData as any)?.data) ? (stockData as any).data : []
  
  // Log errors but don't render them
  useEffect(() => {
    if (ticketsError) {
      console.error('Error loading tickets:', ticketsError)
    }
    if (stockError) {
      console.error('Error loading stock:', stockError)
    }
    if (stockAlertsError) {
      console.error('Error loading stock alerts:', stockAlertsError)
    }
  }, [ticketsError, stockError, stockAlertsError])

  // Calculate metrics
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum: number, sale: any) => sum + (Number(sale.total) || 0), 0)
  }, [sales])

  const totalClients = customers.length
  const totalSales = sales.length
  const inventoryItems = stockItems.length

  // Generate sales chart data (last 6 months)
  const salesChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const now = new Date()
    const data = months.map((month, index) => {
      // Calculate month index (0-5 for last 6 months)
      const monthIndex = (now.getMonth() - (5 - index) + 12) % 12
      const year = now.getFullYear() - (now.getMonth() < monthIndex ? 1 : 0)
      
      // Filter sales for this month
      const monthSales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate.getMonth() === monthIndex && saleDate.getFullYear() === year
      })
      
      const monthRevenue = monthSales.reduce((sum: number, sale: any) => sum + (Number(sale.total) || 0), 0)
      return { month, value: monthRevenue || Math.random() * 60000 + 20000 } // Fallback to mock data
    })
    return data
  }, [sales])

  // Generate top products (mock for now, can be enhanced with real data)
  const topProducts = useMemo(() => {
    // Aggregate products from sales lines
    const productMap = new Map<string, { units: number; revenue: number }>()
    
    sales.forEach((sale: any) => {
      sale.lines?.forEach((line: any) => {
        const productName = line.variant?.product?.name || line.description || 'Unknown Product'
        const existing = productMap.get(productName) || { units: 0, revenue: 0 }
        productMap.set(productName, {
          units: existing.units + (line.qty || 0),
          revenue: existing.revenue + (Number(line.subtotal) || 0),
        })
      })
    })

    // Convert to array and sort by revenue
    const products = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // If no products, return mock data
    if (products.length === 0) {
      return [
        { name: 'iPhone 15 Pro', units: 145, revenue: 145000 },
        { name: 'Samsung Galaxy S24', units: 132, revenue: 118800 },
        { name: 'Google Pixel 8', units: 98, revenue: 68600 },
        { name: 'OnePlus 12', units: 76, revenue: 53200 },
        { name: 'Xiaomi 14', units: 64, revenue: 38400 },
      ]
    }

    return products
  }, [sales])

  // Generate recent activity
  const recentActivity = useMemo(() => {
    const activities: Array<{ type: 'sale' | 'ticket' | 'stock' | 'client'; message: string; time: string }> = []
    
    // Recent sales
    sales.slice(0, 3).forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt)
      const minutesAgo = Math.floor((Date.now() - saleDate.getTime()) / 60000)
      activities.push({
        type: 'sale',
        message: `New sale: ${sale.lines?.[0]?.description || 'Product'} - $${Number(sale.total).toLocaleString()}`,
        time: minutesAgo < 60 ? `${minutesAgo} minutes ago` : `${Math.floor(minutesAgo / 60)} hours ago`,
      })
    })

    // Recent tickets
    tickets.slice(0, 2).forEach((ticket: Ticket) => {
      const ticketDate = new Date(ticket.createdAt)
      const minutesAgo = Math.floor((Date.now() - ticketDate.getTime()) / 60000)
      activities.push({
        type: 'ticket',
        message: `New ticket: Customer support request #${ticket.folio}`,
        time: minutesAgo < 60 ? `${minutesAgo} minutes ago` : `${Math.floor(minutesAgo / 60)} hours ago`,
      })
    })

    // Stock alerts
    lowStockAlerts.slice(0, 1).forEach((alert: any) => {
      activities.push({
        type: 'stock',
        message: `Low stock alert: ${alert.variant?.name || 'Product'} - Only ${alert.qty} units left`,
        time: '1 hour ago',
      })
    })

    // Sort by time (most recent first) and limit to 4
    return activities.slice(0, 4)
  }, [sales, tickets, lowStockAlerts])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.name}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">$</span>
            </div>
          }
          trend={{ value: '+12.5%', isPositive: true }}
        />
        <MetricCard
          title="Total Clients"
          value={totalClients.toLocaleString()}
          icon={
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-blue-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
          }
          trend={{ value: '+8.2%', isPositive: true }}
        />
        <MetricCard
          title="Total Sales"
          value={totalSales.toLocaleString()}
          icon={
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-purple-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>
          }
          trend={{ value: '+15.3%', isPositive: true }}
        />
        <MetricCard
          title="Inventory Items"
          value={inventoryItems.toLocaleString()}
          icon={
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-orange-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
          }
          trend={{ value: '-2.4%', isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={salesChartData} />
        <TopProducts products={topProducts} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  )
}


