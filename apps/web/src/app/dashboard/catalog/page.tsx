'use client'

import { useState, useEffect } from 'react'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories, useBrands, Product } from '../../../lib/hooks/useCatalog'
import { useAuthStore } from '../../../stores/auth'

// --- Iconos ---
const IconEdit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const IconView = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconDelete = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.54 0c-.27 0-.537.019-.804.055l-3.478.397m14.456 0l-3.478-.397m-12.54 0l3.478-.397m9.064 0l-3.478-.397M9.26 9v9.969" />
  </svg>
);
// --- Fin iconos ---

// Product type is now imported from useCatalog hook

interface NewProductForm {
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
}

interface Category {
  id: number;
  name: string;
  children?: Category[];
}

interface Brand {
  label: string;
  value: string;
}

// Removed initialProducts and filtersData - now using API (useCategories and useBrands hooks)

// --- Estados para formularios ---
const newProductInitialState: NewProductForm = {
  name: '',
  description: '',
  category: 'Pantallas',
  brand: 'Apple',
  model: '',
};

export default function CatalogPage() {
  const user = useAuthStore((state) => state.user)

  // --- Estados para los filtros ---
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // API hooks
  const { data: productsData, isLoading, error } = useProducts({
    categoria: selectedCategory || undefined,
    marca: selectedBrand || undefined,
    q: searchTerm || undefined,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Get products from API
  const products = productsData?.data || [];
  const pagination = productsData?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // --- Estados para el Modal "Agregar/Editar" ---
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [newProductData, setNewProductData] = useState<NewProductForm>(newProductInitialState);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // --- Estados para el Modal "Eliminar" ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  // --- Estados para el Modal "Ver Detalles" ---
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [itemToView, setItemToView] = useState<Product | null>(null);


  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrand, searchTerm, itemsPerPage]);

  // -------------------------------------
  // LOGICA DE MODALES (AGREGAR/EDITAR)
  // -------------------------------------
  const openEditProductModal = (product: Product) => {
    setProductToEdit(product);
    setNewProductData({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      model: product.model,
    });
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductToEdit(null);
    setNewProductData(newProductInitialState);
  };

  const handleSaveProduct = async () => {
    if (!newProductData.name) {
      alert('Completa el nombre del producto.');
      return;
    }

    try {
      if (productToEdit) {
        await updateProduct.mutateAsync({
          id: productToEdit.id,
          data: {
            name: newProductData.name,
            description: newProductData.description || undefined,
            category: newProductData.category || undefined,
            brand: newProductData.brand || undefined,
            model: newProductData.model || undefined,
          },
        });
      } else {
        await createProduct.mutateAsync({
          name: newProductData.name,
          description: newProductData.description || undefined,
          category: newProductData.category || undefined,
          brand: newProductData.brand || undefined,
          model: newProductData.model || undefined,
        });
      }
      closeProductModal();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al guardar'}`);
    }
  };

  const handleProductModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProductData({ ...newProductData, [name]: value });
  };

  // ----------------------------
  // LOGICA DE MODAL (ELIMINAR)
  // ----------------------------
  const openDeleteModal = (item: Product) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteProduct.mutateAsync(itemToDelete.id);
      closeDeleteModal();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al eliminar'}`);
    }
  };

  // --------------------------------
  // LOGICA DE MODAL (VER DETALLES)
  // --------------------------------
  const openViewModal = (item: Product) => {
    setItemToView(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setItemToView(null);
  };

  // Filtering now handled by backend API

  // Filtering now handled by backend API
  const filteredProducts = products;

  return (
    <div className="space-y-6">
      {/* --- encabezado --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-600">Gestión centralizada de productos</p>
        </div>
        <button
          onClick={() => {
            setProductToEdit(null);
            setNewProductData(newProductInitialState);
            setIsProductModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Nuevo Producto
        </button>
      </div>

      {/* --- layout de 2 columnas --- */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">

        {/* --- columna izquierda: sidebar de filtros --- */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filtros</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input type="text" placeholder="Nombre, Modelo..." className="w-full border border-gray-300 rounded-md px-3 py-2" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* filtro simple de categoria (para coincidir con los datos mock actuales) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                <option value="">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- columna derecha: tabla de productos --- */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading && (
              <div className="p-8 text-center text-gray-500">Cargando productos...</div>
            )}
            {error && (
              <div className="p-8 text-center text-red-500">Error al cargar productos: {error instanceof Error ? error.message : 'Error desconocido'}</div>
            )}
            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product: Product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{product.name}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{product.category}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.brand}</div>
                            <div className="text-sm text-gray-500">{product.model}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-900 max-w-xs truncate">{product.description}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button onClick={() => openViewModal(product)} title="Ver Detalles" className="p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors">
                              <IconView className="w-5 h-5" />
                            </button>
                            <button onClick={() => openEditProductModal(product)} title="Editar" className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors">
                              <IconEdit className="w-5 h-5" />
                            </button>
                            <button onClick={() => openDeleteModal(product)} title="Eliminar" className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors">
                              <IconDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginacion */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pagination.totalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}</span> a <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> de <span className="font-medium">{pagination.total}</span> productos
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-gray-700">Items por pág:</label>
                  <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1 text-sm">
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Pág {pagination.page} de {pagination.totalPages || 1}
                    </span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pagination.totalPages || pagination.totalPages === 0 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALES --- */}

      {/* --- modal "nuevo/editar producto" --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {productToEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                <input type="text" name="name" value={newProductData.name} onChange={handleProductModalChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="description" value={newProductData.description} onChange={handleProductModalChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select name="category" value={newProductData.category} onChange={handleProductModalChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marca</label>
                  <select name="brand" value={newProductData.brand} onChange={handleProductModalChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="">Selecciona una marca</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Modelo(s)</label>
                <input type="text" name="model" value={newProductData.model} onChange={handleProductModalChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ej: iPhone 12/13" />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button onClick={closeProductModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleSaveProduct} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                {productToEdit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- modmal "confirmar eliminacion" --- */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
            <p className="text-gray-600 mt-4">
              ¿Estás seguro de que deseas eliminar el producto: <span className="font-medium">{itemToDelete.name}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-1">(ID: {itemToDelete.id})</p>
            <p className="text-sm font-bold text-red-600 mt-2">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeDeleteModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- modal "ver detalles" --- */}
      {isViewModalOpen && itemToView && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Producto</h2>
            <div className="space-y-3 pt-4">
              <div className="flex justify-between border-b pb-2"><span className="font-medium text-gray-500">ID</span><span className="font-medium text-gray-900">{itemToView.id}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium text-gray-500">Nombre</span><span className="font-medium text-gray-900">{itemToView.name}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium text-gray-500">Categoría</span><span className="font-medium text-gray-900">{itemToView.category}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium text-gray-500">Marca</span><span className="font-medium text-gray-900">{itemToView.brand}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium text-gray-500">Modelo</span><span className="font-medium text-gray-900">{itemToView.model}</span></div>
              <div className="border-b pb-2"><span className="font-medium text-gray-500">Descripción</span><p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{itemToView.description}</p></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium text-gray-500">Creado</span><span className="font-medium text-gray-900">{new Date(itemToView.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button onClick={closeViewModal} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
