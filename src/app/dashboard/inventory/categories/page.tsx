'use client'

import { useState } from 'react'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '../../../../lib/hooks/useCatalog'
import { IconEdit, IconDelete, IconPlus } from '../_components/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CategoriesPage() {
  // --- estados para categorías ---
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState<string>('')
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('')
  const [isSubcategory, setIsSubcategory] = useState<boolean>(false)
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState<boolean>(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  // Obtener categorías desde la API
  const { data: categories = [] } = useCategories()
  
  // Hooks CRUD de categoría
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  
  // Obtener nombre actual de la ruta
  const pathname = usePathname()
  
  // Organizar categorías en jerarquía (padres e hijos)
  const organizeCategories = (cats: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>()
    const rootCategories: Category[] = []
    
    // Primero, crear un mapa de todas las categorías
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })
    
    // Luego, organizar en jerarquía
    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        if (!parent.children) parent.children = []
        parent.children.push(category)
      } else {
        rootCategories.push(category)
      }
    })
    
    return rootCategories
  }
  
  // Función para aplanar categorías recursivamente para búsqueda
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = []
    cats.forEach(cat => {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children))
      }
    })
    return result
  }
  
  // Organizar categorías en jerarquía
  const organizedCategories = organizeCategories(categories)
  
  // Filtrar categorías por búsqueda
  const allCategoriesFlat = flattenCategories(organizedCategories)
  const filteredCategories = allCategoriesFlat.filter((cat) => {
    return cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  })
  
  // Obtener todas las categorías planas para el filtro (sin subcategorías anidadas en el select)
  const flatCategories = categories.filter(cat => !cat.parentId)

  //-------------------
  // GESTIÓN DE CATEGORÍAS
  //-------------------
  const openAddCategoryModal = () => {
    setCategoryToEdit(null)
    setNewCategoryName('')
    setSelectedParentCategory('')
    setIsSubcategory(false)
    setIsCategoryModalOpen(true)
  }
  
  const openEditCategoryModal = (category: Category) => {
    setCategoryToEdit(category)
    setNewCategoryName(category.name)
    setSelectedParentCategory(category.parentId?.toString() || '')
    setIsSubcategory(!!category.parentId)
    setIsCategoryModalOpen(true)
  }
  
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setCategoryToEdit(null)
    setNewCategoryName('')
    setSelectedParentCategory('')
    setIsSubcategory(false)
  }
  
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Por favor, ingresa un nombre para la categoría.')
      return
    }
    
    if (isSubcategory && !selectedParentCategory) {
      alert('Por favor, selecciona una categoría principal para la subcategoría.')
      return
    }
    
    try {
      if (categoryToEdit) {
        await updateCategory.mutateAsync({
          id: categoryToEdit.id,
          data: { 
            name: newCategoryName.trim(),
            parentId: isSubcategory && selectedParentCategory ? parseInt(selectedParentCategory) : null
          }
        })
      } else {
        await createCategory.mutateAsync({ 
          name: newCategoryName.trim(),
          parentId: isSubcategory && selectedParentCategory ? parseInt(selectedParentCategory) : null
        })
      }
      closeCategoryModal()
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al guardar categoría'}`)
    }
  }
  
  const openDeleteCategoryModal = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteCategoryModalOpen(true)
  }
  
  const closeDeleteCategoryModal = () => {
    setIsDeleteCategoryModalOpen(false)
    setCategoryToDelete(null)
  }
  
  const handleConfirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory.mutateAsync(categoryToDelete.id)
        closeDeleteCategoryModal()
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar'
        if (errorMessage.includes('items') || errorMessage.includes('productos') || errorMessage.includes('asignados')) {
          alert('No se puede eliminar la categoría porque tiene productos asignados.')
        } else {
          alert(`Error: ${errorMessage}`)
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* --- encabezado --- */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
        <p className="text-muted-foreground">Gestión de existencias por sucursal</p>
      </div>

      {/* --- tabs de navegación --- */}
      <div className="border-b border-border">
        <div className="flex justify-between items-center">
          <nav className="-mb-px flex space-x-8 flex-1">
            <Link
              href="/dashboard/inventory"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                pathname === '/dashboard/inventory' || pathname === '/dashboard/inventory/'
                  ? 'border-blue-500 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Inventario
            </Link>
            <Link
              href="/dashboard/catalog"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                pathname === '/dashboard/catalog'
                  ? 'border-blue-500 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Catálogo
            </Link>
            <Link
              href="/dashboard/inventory/categories"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                pathname === '/dashboard/inventory/categories'
                  ? 'border-blue-500 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Categorías
            </Link>
            <Link
              href="/dashboard/inventory/brands"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                pathname === '/dashboard/inventory/brands'
                  ? 'border-blue-500 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Marcas
            </Link>
          </nav>
        </div>
      </div>

      {/* --- Tab de Categorías --- */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Categorías</h2>
          <button
            onClick={openAddCategoryModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <IconPlus className="w-4 h-4" />
            <span>Agregar Categoría</span>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-2"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                      No hay categorías disponibles
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => {
                    const isSubcat = !!category.parentId
                    const parentCategory = categories.find(c => c.id === category.parentId)
                    return (
                      <tr key={category.id} className="hover:bg-muted">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{category.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {isSubcat && <span className="text-muted-foreground mr-2">└─</span>}
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {isSubcat ? (
                            <span className="text-xs">Subcategoría de: {parentCategory?.name || 'N/A'}</span>
                          ) : (
                            <span className="text-xs">Categoría principal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            {!isSubcat && (
                              <button
                                onClick={() => {
                                  setSelectedParentCategory(category.id.toString())
                                  setIsSubcategory(true)
                                  setNewCategoryName('')
                                  setCategoryToEdit(null)
                                  setIsCategoryModalOpen(true)
                                }}
                                title="Agregar subcategoría"
                                className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
                              >
                                <IconPlus className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditCategoryModal(category)}
                              title="Editar"
                              className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"
                            >
                              <IconEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openDeleteCategoryModal(category)}
                              title="Eliminar"
                              className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"
                            >
                              <IconDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal de Categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">
              {categoryToEdit 
                ? 'Editar Categoría' 
                : isSubcategory 
                  ? 'Agregar Subcategoría' 
                  : 'Agregar Categoría'}
            </h2>
            <div className="mt-4 space-y-4">
              {categoryToEdit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ID</label>
                  <input
                    type="text"
                    value={categoryToEdit.id}
                    disabled
                    className="w-full border border-border rounded-md px-3 py-2 bg-gray-100 text-muted-foreground"
                  />
                </div>
              )}
              {!categoryToEdit && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSubcategory}
                      onChange={(e) => {
                        setIsSubcategory(e.target.checked)
                        if (!e.target.checked) {
                          setSelectedParentCategory('')
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm font-medium text-foreground">Crear como subcategoría</span>
                  </label>
                </div>
              )}
              {isSubcategory && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Categoría Principal</label>
                  <select
                    value={selectedParentCategory}
                    onChange={(e) => setSelectedParentCategory(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2"
                    disabled={!!categoryToEdit}
                  >
                    <option value="">Selecciona una categoría principal</option>
                    {flatCategories
                      .filter(cat => !categoryToEdit || cat.id !== categoryToEdit.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={isSubcategory ? "Nombre de la subcategoría" : "Nombre de la categoría"}
                  className="w-full border border-border rounded-md px-3 py-2"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeCategoryModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                {categoryToEdit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminar Categoría */}
      {isDeleteCategoryModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
            <p className="text-muted-foreground mt-4">
              ¿Estás seguro de que deseas eliminar la categoría: <span className="font-medium">{categoryToDelete.name}</span>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Solo se puede eliminar si no tiene productos asignados.
            </p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeDeleteCategoryModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}