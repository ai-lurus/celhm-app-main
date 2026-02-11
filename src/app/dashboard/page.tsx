'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/auth'
import { MetricCard } from '../../components/MetricCard'
import { SalesChart } from '../../components/SalesChart'
import { TopProducts } from '../../components/TopProducts'
import { RecentActivity } from '../../components/RecentActivity'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  // Get summary metrics
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary')
      return response.data
    },
    enabled: !!user,
  })

  // Get sales chart data
  const { data: salesChartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['dashboard', 'chart'],
    queryFn: async () => {
      const response = await api.get('/dashboard/chart')
      return response.data
    },
    enabled: !!user,
  })

  // Get top products
  const { data: topProducts, isLoading: isLoadingTopProducts } = useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: async () => {
      const response = await api.get('/dashboard/top-products')
      return response.data
    },
    enabled: !!user,
  })

  // Get recent activity
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent')
      return response.data
    },
    enabled: !!user,
  })

  if (isLoadingSummary || isLoadingChart || isLoadingTopProducts || isLoadingActivity) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

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
          value={`$${(summary?.totalRevenue || 0).toLocaleString()}`}
          icon={
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">$</span>
            </div>
          }
        // trend={{ value: '+12.5%', isPositive: true }} // TODO: Implement trend calculation
        />
        <MetricCard
          title="Total Clients"
          value={(summary?.totalClients || 0).toLocaleString()}
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
        // trend={{ value: '+8.2%', isPositive: true }}
        />
        <MetricCard
          title="Total Sales"
          value={(summary?.totalSales || 0).toLocaleString()}
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
        // trend={{ value: '+15.3%', isPositive: true }}
        />
        <MetricCard
          title="Inventory Items"
          value={(summary?.inventoryItems || 0).toLocaleString()}
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
        // trend={{ value: '-2.4%', isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={salesChartData || []} />
        <TopProducts products={topProducts || []} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <RecentActivity activities={recentActivity || []} />
      </div>
    </div>
  )
}
