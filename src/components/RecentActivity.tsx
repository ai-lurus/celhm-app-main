interface Activity {
  type: 'sale' | 'ticket' | 'stock' | 'client'
  message: string
  time: string
}

interface RecentActivityProps {
  activities: Activity[]
  title?: string
}

const activityColors = {
  sale: 'bg-green-500',
  ticket: 'bg-blue-500',
  stock: 'bg-orange-500',
  client: 'bg-purple-500',
}

export function RecentActivity({ activities, title = 'Recent Activity' }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div
              className={`w-2 h-2 rounded-full mt-2 ${activityColors[activity.type]}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

