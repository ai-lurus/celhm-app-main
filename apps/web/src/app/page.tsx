import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CELHM
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de Inventario y Tickets de Reparación
          </p>
          <div className="space-x-4">
            <Link href="/login">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                Iniciar Sesión
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-3 px-6 rounded-lg border border-blue-600">
                Ver Demo
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

