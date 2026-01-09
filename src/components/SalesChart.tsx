'use client'

interface SalesData {
  month: string
  value: number
}

interface SalesChartProps {
  data: SalesData[]
  title?: string
}

export function SalesChart({ data, title = 'Sales Trend' }: SalesChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 0)
  const step = maxValue / 4

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          {[4, 3, 2, 1, 0].map((i) => (
            <span key={i} className="text-right">
              {Math.round(step * i).toLocaleString()}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border-t border-gray-200 dark:border-gray-700"
                style={{ height: `${100 / 4}%` }}
              />
            ))}
          </div>

          {/* Line chart */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={data
                .map(
                  (d, i) =>
                    `${(i / (data.length - 1)) * 100},${
                      100 - (d.value / maxValue) * 100
                    }`
                )
                .join(' ')}
            />
          </svg>

          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100
            const y = 100 - (d.value / maxValue) * 100
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            )
          })}
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {data.map((d, i) => (
            <span key={i}>{d.month}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

