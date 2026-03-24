'use client'

import { useState } from 'react'
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useDeviceModels,
  useCreateDeviceModel,
  useUpdateDeviceModel,
  useDeleteDeviceModel,
  Brand,
  DeviceModel,
} from '../../../../lib/hooks/useCatalog'
import { useToast } from '../../../../hooks/use-toast'
import { IconEdit, IconDelete, IconPlus } from '../_components/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const DEVICE_TYPES = ['Teléfono', 'Tablet', 'Laptop', 'Smartwatch', 'Otro']

// ── Sub-component: models list for one brand ────────────────────────────────
function BrandModelsRow({ brand }: { brand: Brand }) {
  const { toast } = useToast()
  const { data: models = [] } = useDeviceModels(brand.id)
  const createModel = useCreateDeviceModel()
  const updateModel = useUpdateDeviceModel()
  const deleteModel = useDeleteDeviceModel()

  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [modelToEdit, setModelToEdit] = useState<DeviceModel | null>(null)
  const [modelName, setModelName] = useState('')
  const [modelType, setModelType] = useState('')
  const [isDeleteModelOpen, setIsDeleteModelOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<DeviceModel | null>(null)

  const isSaving = createModel.isPending || updateModel.isPending

  const openAddModel = () => {
    setModelToEdit(null)
    setModelName('')
    setModelType('')
    setIsModelModalOpen(true)
  }

  const openEditModel = (m: DeviceModel) => {
    setModelToEdit(m)
    setModelName(m.name)
    setModelType(m.deviceType ?? '')
    setIsModelModalOpen(true)
  }

  const closeModelModal = () => {
    if (isSaving) return
    setIsModelModalOpen(false)
    setModelToEdit(null)
    setModelName('')
    setModelType('')
  }

  const handleSaveModel = async () => {
    if (!modelName.trim()) {
      toast({ variant: 'destructive', title: 'Nombre requerido', description: 'Ingresa un nombre para el modelo.' })
      return
    }
    try {
      if (modelToEdit) {
        await updateModel.mutateAsync({ id: modelToEdit.id, data: { name: modelName.trim(), deviceType: modelType || undefined } })
        toast({ variant: 'success', title: 'Modelo actualizado', description: 'El modelo se ha actualizado correctamente.' })
      } else {
        await createModel.mutateAsync({ brandId: brand.id, name: modelName.trim(), deviceType: modelType || undefined })
        toast({ variant: 'success', title: 'Modelo creado', description: 'El modelo se ha creado correctamente.' })
      }
      closeModelModal()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message || 'Error al guardar modelo' })
    }
  }

  const handleDeleteModel = async () => {
    if (!modelToDelete) return
    try {
      await deleteModel.mutateAsync(modelToDelete.id)
      toast({ variant: 'success', title: 'Modelo eliminado', description: 'El modelo se ha eliminado correctamente.' })
      setIsDeleteModelOpen(false)
      setModelToDelete(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: error.message || 'Error al eliminar modelo' })
    }
  }

  return (
    <>
      <tr className="bg-muted/40">
        <td colSpan={3} className="px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Modelos de {brand.name} ({models.length})
            </span>
            <button
              onClick={openAddModel}
              className="flex items-center space-x-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
            >
              <IconPlus className="w-3 h-3" />
              <span>Agregar Modelo</span>
            </button>
          </div>
          {models.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin modelos registrados. Agrega el primero.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {models.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    {m.deviceType && (
                      <span className="inline-flex text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-0.5">
                        {m.deviceType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModel(m)}
                      title="Editar"
                      className="p-1 rounded text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setModelToDelete(m); setIsDeleteModelOpen(true) }}
                      title="Eliminar"
                      className="p-1 rounded text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"
                    >
                      <IconDelete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </td>
      </tr>

      {/* Modal Agregar/Editar Modelo */}
      {isModelModalOpen && (
        <tr>
          <td colSpan={3}>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
              <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground">
                  {modelToEdit ? 'Editar Modelo' : `Agregar Modelo — ${brand.name}`}
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Nombre del modelo *</label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Ej: iPhone 15 Pro"
                      className="w-full border border-border rounded-md px-3 py-2"
                      autoFocus
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Tipo de dispositivo</label>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2"
                      disabled={isSaving}
                    >
                      <option value="">Sin clasificar</option>
                      {DEVICE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button onClick={closeModelModal} disabled={isSaving} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50">
                    Cancelar
                  </button>
                  <button onClick={handleSaveModel} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 flex items-center">
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      modelToEdit ? 'Actualizar' : 'Guardar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Confirm delete model */}
      {isDeleteModelOpen && modelToDelete && (
        <tr>
          <td colSpan={3}>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
              <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
                <p className="text-muted-foreground mt-4">
                  ¿Eliminar el modelo <span className="font-medium">{modelToDelete.name}</span>?
                  <br /><span className="text-xs text-amber-600">No se puede eliminar si tiene tickets asociados.</span>
                </p>
                <div className="flex justify-end space-x-4 mt-6">
                  <button onClick={() => { setIsDeleteModelOpen(false); setModelToDelete(null) }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
                  <button onClick={handleDeleteModel} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Eliminar</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function BrandsPage() {
  const pathname = usePathname()
  const { toast } = useToast()

  const [brandSearch, setBrandSearch] = useState<string>('')
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState<boolean>(false)
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null)
  const [newBrandName, setNewBrandName] = useState<string>('')
  const [isDeleteBrandModalOpen, setIsDeleteBrandModalOpen] = useState<boolean>(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)

  const { data: brands = [] } = useBrands()
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const deleteBrand = useDeleteBrand()
  const isSaving = createBrand.isPending || updateBrand.isPending

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  )

  const openAddBrandModal = () => {
    setBrandToEdit(null)
    setNewBrandName('')
    setIsBrandModalOpen(true)
  }

  const openEditBrandModal = (brand: Brand) => {
    setBrandToEdit(brand)
    setNewBrandName(brand.name)
    setIsBrandModalOpen(true)
  }

  const closeBrandModal = () => {
    if (isSaving) return
    setIsBrandModalOpen(false)
    setBrandToEdit(null)
    setNewBrandName('')
  }

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      toast({ variant: 'destructive', title: 'Nombre requerido', description: 'Por favor, ingresa un nombre para la marca.' })
      return
    }
    try {
      if (brandToEdit) {
        await updateBrand.mutateAsync({ id: brandToEdit.id, data: { name: newBrandName.trim() } })
        toast({ variant: 'success', title: 'Marca actualizada', description: 'La marca se ha actualizado correctamente.' })
      } else {
        await createBrand.mutateAsync({ name: newBrandName.trim() })
        toast({ variant: 'success', title: 'Marca creada', description: 'La marca se ha creada correctamente.' })
      }
      closeBrandModal()
    } catch (error: any) {
      const rawMsg = error.response?.data?.message
      toast({ variant: 'destructive', title: 'Error al guardar', description: typeof rawMsg === 'string' ? rawMsg : (error.message || 'Error al guardar marca') })
    }
  }

  const handleConfirmDeleteBrand = async () => {
    if (!brandToDelete) return
    try {
      await deleteBrand.mutateAsync(brandToDelete.id)
      toast({ variant: 'success', title: 'Marca eliminada', description: 'La marca se ha eliminado correctamente.' })
      setIsDeleteBrandModalOpen(false)
      setBrandToDelete(null)
    } catch (error: any) {
      const rawMsg = error.response?.data?.message
      toast({ variant: 'destructive', title: 'Error al eliminar', description: typeof rawMsg === 'string' ? rawMsg : (error.message || 'Error al eliminar marca') })
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
        <p className="text-muted-foreground">Gestión de existencias por sucursal</p>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-border">
        <div className="flex justify-between items-center">
          <nav className="-mb-px flex space-x-8 flex-1">
            <Link href="/dashboard/inventory" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${pathname === '/dashboard/inventory' ? 'border-blue-500 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
              Inventario
            </Link>
            <Link href="/dashboard/catalog" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${pathname === '/dashboard/catalog' ? 'border-blue-500 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
              Catálogo
            </Link>
            <Link href="/dashboard/inventory/categories" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${pathname === '/dashboard/inventory/categories' ? 'border-blue-500 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
              Categorías
            </Link>
            <Link href="/dashboard/inventory/brands" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${pathname === '/dashboard/inventory/brands' ? 'border-blue-500 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
              Marcas y Modelos
            </Link>
          </nav>
        </div>
      </div>

      {/* Panel de Marcas */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Marcas y Modelos de Dispositivos</h2>
          <button onClick={openAddBrandModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2">
            <IconPlus className="w-4 h-4" />
            <span>Agregar Marca</span>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar marca..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-2"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre de Marca</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-muted-foreground">No hay marcas disponibles</td>
                  </tr>
                ) : (
                  filteredBrands.map((brand) => (
                    <>
                      <tr key={brand.id} className="hover:bg-muted">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{brand.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setExpandedBrandId(expandedBrandId === brand.id ? null : brand.id)}
                            className="text-sm font-medium text-foreground hover:text-primary flex items-center space-x-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`w-4 h-4 transition-transform ${expandedBrandId === brand.id ? 'rotate-90' : ''}`}
                              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                            <span>{brand.name}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button onClick={() => openEditBrandModal(brand)} title="Editar" className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors">
                              <IconEdit className="w-5 h-5" />
                            </button>
                            <button onClick={() => { setBrandToDelete(brand); setIsDeleteBrandModalOpen(true) }} title="Eliminar" className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors">
                              <IconDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedBrandId === brand.id && (
                        <BrandModelsRow key={`models-${brand.id}`} brand={brand} />
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Marca */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">{brandToEdit ? 'Editar Marca' : 'Agregar Marca'}</h2>
            <div className="mt-4 space-y-4">
              {brandToEdit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ID</label>
                  <input type="text" value={brandToEdit.id} disabled className="w-full border border-border rounded-md px-3 py-2 bg-muted text-muted-foreground" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Nombre de la marca"
                  className="w-full border border-border rounded-md px-3 py-2"
                  autoFocus
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeBrandModal} disabled={isSaving} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleSaveBrand} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 flex items-center">
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (brandToEdit ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Marca */}
      {isDeleteBrandModalOpen && brandToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
            <p className="text-muted-foreground mt-4">
              ¿Estás seguro de que deseas eliminar la marca: <span className="font-medium">{brandToDelete.name}</span>?
              <br /><span className="text-xs text-amber-600">Esto también eliminará todos sus modelos.</span>
            </p>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={() => { setIsDeleteBrandModalOpen(false); setBrandToDelete(null) }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleConfirmDeleteBrand} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}