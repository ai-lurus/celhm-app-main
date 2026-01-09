interface Product {
  name: string
  units: number
  revenue: number
}

interface TopProductsProps {
  products: Product[]
  title?: string
}

export function TopProducts({ products, title = 'Top Selling Products' }: TopProductsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {product.units} units sold
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                ${product.revenue.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

